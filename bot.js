// use for auth url
let codes = require('./utils/codes'),
    logger = require('./utils/logger'),
    Client = require('./utils/clientProvider'),
    hi = require('./utils/highlight'),
    process = require('process'),
    State = require('./utils/state'),
    Settings = require('./utils/settings');

class Bot{

    start(){
        try
        {
            this.settings = Settings.instance();
            this.client = Client.instance();
            this.state = State.instance();

            if (this.settings.failed){
                console.log('settings.json not found');
                return;
            }

            this.commands = {};
            this.commands.status = require('./commands/status');
            this.commands.me = require('./commands/me');
            this.commands.brackets = require('./commands/brackets');
            this.commands.start = require('./commands/start');
            this.commands.help = require('./commands/help');
            this.commands.list = require('./commands/list');
            this.commands.queue = require('./commands/queue');
            this.commands.reroll = require('./commands/reroll');
            this.commands.rules = require('./commands/rules');
            this.commands.cancel = require('./commands/cancel');
            this.commands.channel = require('./commands/channel');

            this.client.login(this.settings.values.token);

            this.client.on('ready', function(){
                this._onReady();
            }.bind(this));

            this.client.on('message', async function(message) {
                return this._onMessage(message)
            }.bind(this));

            process.on('unhandledRejection', (reason) => {
                logger.error.error('Unhandled promise : ' + reason);
            });

        } catch (ex){
            this._handleUnexpectedError(ex);
        }
    }

    _handleUnexpectedError(ex, message){
        try
        {
            logger.error.error(ex);
            if (message)
                message.author.send('An unexpected error occurred and has been logged.');
        } catch (ex){
            console.log('An unexpected error occurred, failed to return message to user.', ex);
        }
    }

    async startDaemon(){
        try
        {
            let daemon = require('./utils/daemon');
            await daemon();
        } catch (ex){
            this._handleUnexpectedError(ex);
        }
    }

    _onReady(){
        // todo : validate settings

        console.log('Bot is ready');
    }

    async _onMessage(message){
        return new Promise(async function(resolve, reject){
            try {
                if (message.content.indexOf(`<@${this.client.user.id}>`) === 0 && message.content.toLowerCase().trim() !== `<@${this.client.user.id}> channel`) {
                    message.reply('Please message me directly.');
                    return resolve(codes.MESSAGE_REJECTED_UNTARGETED);
                }

                // quietly ignore all messages not directly aimed at me
                if (message.content.toLowerCase().trim() !== `<@${this.client.user.id}> channel` && message.channel.type !== 'dm') {
                    return resolve(codes.MESSAGE_REJECTED_UNTARGETED);
                }

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
                if (message.mentions.users.array().length > 0 && !message.mentions.users.find('id', this.client.user.id))
                    return resolve(codes.MESSAGE_REJECTED_UNTARGETED);

                // sanitize incoming message text
                let atBot = `<@${this.client.user.id}>`;
                let messageText  = message.content;
                if (messageText.indexOf(atBot) === 0)
                    messageText = messageText.substr(atBot.length);

                messageText = messageText.trim();

                // get first word of incoming message, this will be the command the user is trying to execute
                let args = messageText.split(' '),
                    requestedCommand = null;

                if (args.length)
                    requestedCommand = args[0];

                let command = this.commands[requestedCommand];
                if (!command){
                    message.author.send(`Sorry, I don't understand that command. Try asking me ${hi('help')} maybe?`);
                    return resolve(codes.MESSAGE_REJECTED_UNKNOWNCOMMAND);
                }

                if (requestedCommand !== 'channel' && !this.settings.values.giveawayChannelId){
                    message.author.send(`Giveaway channel not set - please go to your intended giveaway channel and ${hi('@me channel')} where 'me' is my botname.`);
                    return resolve(codes.MESSAGE_REJECTED_CHANNELNOTSET);
                }

                let result = await command(this.client, message, messageText);
                resolve(result);

                if (requestedCommand !== 'status' && this.state.length())
                    message.author.send(`There are issues with the bot - use ${hi('status')} for more info, or ask an admin to do so.`);

            } catch (ex) {
                this._handleUnexpectedError(ex, message);
                return reject(ex);
            }
        }.bind(this));
    }
}

module.exports = Bot;