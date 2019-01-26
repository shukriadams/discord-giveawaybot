/**
 * The main bot file. Handles incoming messages from users ( _onMessage() function ), and starts the daemon. See
 * ./daemon.js for autonomous bot behaviour, ie, behaviour not based on responding to user messages.
 */
let codes = require('./codes'),
    Logger = require('./logger'),
    Client = require('./clientProvider'),
    Daemon = require('./daemon'),
    Trace = require('./trace'),
    hi = require('./highlight'),
    process = require('process'),
    Store = require('./store'),
    http = require('http'),
    path = require('path'),
    fs = require('fs'),
    State = require('./state'),
    recordFetch = require('./recordFetch'),
    timeHelper = require('./timeHelper'),
    Settings = require('./settings');

class Bot{

    constructor(options){
        options = options || {};

        // process name abbreviated somewhat to make it easier to read on linux systems.
        process.title = 'dc-giveawaybot';

        this.cronEnabled = true;
        this.busyProcessingMessage = false;
        this.willShutdown = false;

        if(options.cronEnabled === false)
            this.cronEnabled = false;
    }


    /**
     * Starts the bot.
     */
    async start(){
        try
        {
            this.logger = Logger.instance();
            this.settings = Settings.instance();
            let client = await Client.instance();
            this.state = State.instance();
            this.trace = Trace.instance();

            if (this.settings.failed){
                console.log('settings.json not found');
                return;
            }

            // load all files in 'commands' folder into this.commands object
            this.commands = {};
            for (let commandFile of fs.readdirSync(path.join(__dirname, 'commands'))){
                let name = path.basename(commandFile.slice(0, -3));
                this.commands[name] = require(`./commands/${name}`);
            }

            client.on('message', async function(message) {
                return this._onMessage(message)
            }.bind(this));

            process.on('unhandledRejection', function (reason){
                this.logger.error.error(`Unhandled promise : ${reason}`);
            }.bind(this));

            // start the daemon
            this.daemon = Daemon.instance();
            this.daemon.onProcessExpired = async function(){
                this.willShutdown = true;
                if (!this.busyProcessingMessage)
                    await this.shutdown();
            }.bind(this);

            if (this.cronEnabled)
                await this.daemon.start();

            // if health monitor enabled, return time since last daemon sign of life. The daemon process will update this
            // SOL after a tick process. Daemon hanging is a common cause of the bot failing
            if (this.settings.values.enableHealthMonitor) {

                http.createServer(function (req, res) {

                    res.writeHead(200, {'Content-Type': 'text/plain'});

                    if (req.url === '/status'){
                        let minutesSinceLastDaemonTick = timeHelper.secondsSince(this.daemon.lastUpdateTime);

                        if (this.settings.values.healthMonitorThreshold === null ||
                            this.settings.values.healthMonitorThreshold === undefined ||
                            this.settings.values.healthMonitorThreshold >= minutesSinceLastDaemonTick)
                                return res.end(minutesSinceLastDaemonTick.toString());

                        return;
                    }

                    res.end('unsupported request');

                }.bind(this)).listen(this.settings.values.healthMonitorPort);

                console.log(`health monitor running on port ${this.settings.values.healthMonitorPort}`);
            }


            console.log('discord-giveawaybot is now running.');
        } catch (ex){
            await this._handleUnexpectedError(ex);
        }
    }


    /**
     * Stops the daemon - allows the bot process to exit. This is required by unit tests, which would otherwise hang.
     */
    stop(){
        if (this.daemon)
            this.daemon.stop();
    }


    /**
     * Common handler for all unhandled exceptions derived from incoming user messages. Errors are logged to file and
     * reported to user - if these fail, they get logged to the OS console. Bot shuts down on error, keeping bot alive
     * after unexpected errors can cause the bot to hang. If you want to make the bot resilient to errors, do so outside
     * the bot, with docker, pm2 or systemd.
     */
    async _handleUnexpectedError(ex, message){
        try
        {
            console.log(ex);
            this.logger.error.error(ex);
            if (message)
                message.author.send('An unexpected error occurred and has been logged. Bot will exit.');
        } catch (ex){
            console.log('An unexpected error occurred, failed to return message to user.', ex);
        } finally {
            await this.shutdown();
        }
    }


    /**
     * Shuts bot processes down gracefully. This is triggered triggered when the daemon has flagged the bot for a
     * shutdown. If a message is being processed, shutdown will pause until the message handler has exited.
     */
    async shutdown(){

        // close Loki down gracefully
        let store = await Store.instance();
        await store.close();

        console.log(`Bot doing controlled shut down.`);
        process.exitCode = 0;
        process.exit();
    }


    /**
     * Entry point for all incoming user messages. This is where all user-driven interaction (as opposed to daemon)
     * starts. The message content is sanitized, passed down to one of the command processors in /lib/commands, and the
     * result returned as a Discord message reply.
     */
    async _onMessage(message){
        return new Promise(async function(resolve, reject){
            try {
                this.busyProcessingMessage = true;

                // capture guild id
                if (!this.settings.values.guildId){
                    let guild = await recordFetch.fetchGuild(message.client);
                    if (guild) {
                        this.settings.values.guildId = guild.id;
                        this.settings.save();
                    } else {
                        await message.reply('Critical error - unable to resolve bot guild. Bot cannot function.');
                        return resolve(codes.MESSAGE_REJECTED_GUILDNOTRESOLVABLE);
                    }
                }

                // reject messages @bot (these are public messages), unless message is to set "channel"
                if (message.content.indexOf(`<@${message.client.user.id}>`) === 0 && message.content.toLowerCase().trim() !== `<@${message.client.user.id}> channel`) {
                    await message.reply('Please message me directly.');
                    return resolve(codes.MESSAGE_REJECTED_UNTARGETED);
                }

                // repeat of the above, only for dm
                if (message.content.toLowerCase().trim() !== `<@${message.client.user.id}> channel` && message.channel.type !== 'dm')
                    return resolve(codes.MESSAGE_REJECTED_UNTARGETED);

                // ignore messages from other bots
                if (message.author.bot)
                    return resolve(codes.MESSAGE_REJECTED_BOT);

                // ignore global messages
                if (message.mentions.everyone)
                    return resolve(codes.MESSAGE_REJECTED_GLOBAL);

                // ignore group messages
                if (message.mentions.users.size > 1)
                    return resolve(codes.MESSAGE_REJECTED_GROUPMESSAGE);

                // ignore messages not aimed specifically at me
                if (message.mentions.users.array().length > 0 && !message.mentions.users.find('id', message.client.user.id))
                    return resolve(codes.MESSAGE_REJECTED_UNTARGETED);

                // sanitize incoming message text
                let atBot = `<@${message.client.user.id}>`;
                let messageText  = message.content;
                if (messageText.indexOf(atBot) === 0)
                    messageText = messageText.substr(atBot.length);

                messageText = messageText.trim();

                // get first word of incoming message, this will be the command the user is trying to execute
                let args = messageText.split(' '),
                    requestedCommand = args.length ? args[0] : '';

                let command = this.commands[requestedCommand.toLowerCase()];
                if (!command){
                    await message.author.send(`Sorry, I don't understand that command. Try asking me ${hi('help')} maybe?`);
                    return resolve(codes.MESSAGE_REJECTED_UNKNOWNCOMMAND);
                }

                // handle the command, return result
                let result = await command(message, messageText);
                resolve(result);

                // friendly alerts go here ....
                // if a channel has not been set, remind the user of it
                if (requestedCommand !== 'channel' && !this.settings.values.giveawayChannelId)
                    await message.author.send(this.trace(`Giveaway channel not set - please go to your intended giveaway channel and ${hi('@me channel')} where 'me' is my botname.`, codes.ALERT_CHANNELNOTSET));

                // if there are pending status messages, remind the user to check statuses.
                if (requestedCommand !== 'status' && this.state.length())
                    await  message.author.send(`There are issues with the bot - use ${hi('status')} for more info, or ask an admin to do so.`);

            } catch (ex) {
                await this._handleUnexpectedError(ex, message);
                return reject(ex);
            } finally {
                this.busyProcessingMessage = false;
                if (this.willShutdown)
                    await this.shutdown();
            }
        }.bind(this));
    }
}

module.exports = Bot;