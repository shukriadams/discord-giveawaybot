/**
 * Sets the bot's nickname with an error flag. This is a convenient way for the bot to signal that it's in trouble and
 * needs admin attention.
 */
let recordfetch = require('./recordFetch'),
    Settings = require('./settings'),
    Client = require('./clientProvider');

module.exports = {

    /**
     * Turns the error flag on. Flag a string prepended to existing nickname. If no nickname is present, the bot's
     * username is used instead.
     *
     */
    enable : async function alert(){
        let settings = Settings.instance(),
            client = Client.instance(),
            botUser = await recordfetch.fetchGuildMember(client, client.user);

        botUser.setNickname(settings.values.errorNickname + ' ' + botUser.nickname || botUser.username);
    },

    /**
     * Removes the error flag, forcing nickname to
     */
    disable : async function(){
        let client = Client.instance(),
            botUser = await recordfetch.fetchGuildMember(client, client.user);

        botUser.setNickname(client.user.username);
    }
};
