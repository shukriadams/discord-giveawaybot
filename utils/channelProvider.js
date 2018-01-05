/**
 * Gets a channel for the bot to write to.
 */
let Settings = require('./settings'),
    State = require('./state');

module.exports = function(client){
    let settings = Settings.instance(),
        state = State.instance();

    if (!settings.values.giveawayChannelId){
        state.add('settings.giveawayChannelId', `The current giveaway channel ${settings.values.giveawayChannelId} does not exist. Please reset the channel using "@[botname] channel" in the channel you want to use.`);
        return null;
    }

    for (let channel of client.channels.array()){
        if (channel.id === settings.values.giveawayChannelId)
            return channel;
    }

    state.add('settings.giveawayChannelId', `The current giveaway channel ${settings.values.giveawayChannelId} does not exist. Please reset the channel using "@[botname] channel" in the channel you want to use.`);
    return null;
};