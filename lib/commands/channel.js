// cancel ID : cancel an active giveaway if you are admin, or if competition hasn't started yet and you created it

let Settings = require('./../settings'),
    argsHelper = require('../argsHelper'),
    codes = require('./../codes'),
    messages = require('./../messages'),
    State = require('./../state'),
    Logger = require('./../logger'),
    hi = require('./../highlight'),
    permissionHelper = require('./../permissionHelper');

module.exports = async function (message, messageText){

    let settings = Settings.instance(),
        state = State.instance(),
        infoLog = Logger.instance().info,
        args = argsHelper.toArgsObject(messageText),
        isAdmin = await permissionHelper.isAdmin(message.client, message.author);

    if (!isAdmin){
        message.author.send(messages.permissionError);
        return codes.MESSAGE_REJECTED_PERMISSION;
    }

    if (args.h) args.help = true;
    if (args.help) {
        await message.reply(
            `${hi('channel')} sets a channel as the one the bot will broadcast giveaways in.\n\n` +
            `Expected: ${hi('@bot channel')} from the channel you want to set. \n` +
            `Example: ${hi('@ourGiveAwayBot channel')} in #general, if your bot user is called ${hi('ourGiveAwayBot')}.`);

        return codes.MESSAGE_ACCEPTED_HELPRETURNED;
    }

    if (message.channel.type === 'dm'){
        await message.author.send('Only a public channel can be used for giveaways.');
        return codes.MESSAGE_REJECTED_INVALIDCHANNEL;
    }

    settings.values.giveawayChannelId = message.channel.id;
    settings.save();

    await message.reply(`The channel ${hi(message.channel.name)} will now be used for giveaways.`);
    infoLog.info(`User ${message.author.username} set active giveaway channel to ${message.channel.name}.`);
    state.remove('channel_not_set');
    state.remove('settings.giveawayChannelId');

    return codes.MESSAGE_ACCEPTED;

};