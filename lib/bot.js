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
    path = require('path'),
    fs = require('fs'),
    State = require('./state'),
    Settings = require('./settings');

class Bot{

    constructor(options){
        options = options || {};
        this.cronEnabled = true;

        if(options.cronEnabled === false)
            this.cronEnabled = false;
    }

    /**
     * Starts the bot.
     */
    start(){
        try
        {
            this.settings = Settings.instance();
            this.logger = Logger.instance();
            let client = Client.instance();
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

            client.login(this.settings.values.token);

            client.on('ready', function(){
                this._onReady();
            }.bind(this));

            client.on('message', async function(message) {
                return this._onMessage(message)
            }.bind(this));


            process.on('unhandledRejection', function (reason){
                this.logger.error.error(`Unhandled promise : ${reason}`);
            }.bind(this));

            // to avoid making the public bot start function async, wrap the async daemon start in inline async call
            (async function(){
                try
                {
                    this.daemon = Daemon.instance();
                    if (this.cronEnabled)
                        await this.daemon.start();
                } catch (ex){
                    this._handleUnexpectedError(ex);
                }
            }.bind(this))();

        } catch (ex){
            this._handleUnexpectedError(ex);
        }
    }

    stop(){
        if (this.daemon)
            this.daemon.stop();
    }

    /**
     * Common handler for all unhandled exceptions derived from incoming user messages. Errors are logged to file and
     * reported to user - if these fail, they get logged to the OS console.
     */
    _handleUnexpectedError(ex, message){
        try
        {
            this.logger.error.error(ex);
            if (message)
                message.author.send('An unexpected error occurred and has been logged.');
        } catch (ex){
            console.log('An unexpected error occurred, failed to return message to user.', ex);
        }
    }


    /**
     * Called after bot connects to discord and is ready to receive messages.
     */
    _onReady(){
        console.log('Giveawaybot is ready.');

        // todo : validate settings

        // todo : run diagnostics - does bot have a giveaway channel, does it exist, does bot have necessary
        // permissions etc
    }


    /**
     * Entry point for all incoming user messages. This is where all user-driven interaction (as opposed to daemon)
     * starts.
     */
    async _onMessage(message){
        return new Promise(async function(resolve, reject){
            try {

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

                let command = this.commands[requestedCommand];
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
                this._handleUnexpectedError(ex, message);
                return reject(ex);
            }
        }.bind(this));
    }
}

module.exports = Bot;