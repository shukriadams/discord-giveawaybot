// cancel ID : cancel an active giveaway if you are admin, or if competition hasn't started yet and you created it

let Settings = require('./../utils/settings'),
    codes = require('./../utils/codes'),
    messages = require('./../utils/messages'),
    infoLog = require('./../utils/logger').info,
    hi = require('./../utils/highlight'),
    permissionHelper = require('./../utils/permissionHelper');

module.exports = async function (client, message){

    let settings = Settings.instance(),
        isAdmin = await permissionHelper.isAdmin(client, message.author);

    if (!isAdmin){
        message.author.send(messages.permissionError);
        return codes.MESSAGE_REJECTED_PERMISSION;
    }

    if (message.channel.type === 'dm'){
        message.author.send('Only a public channel can be used for giveaways.');
        return codes.MESSAGE_REJECTED_INVALIDCHANNEL;
    }

    settings.values.giveawayChannelId = message.channel.id;
    settings.save();

    message.reply(`The channel ${hi(message.channel.name)} will now be used for giveaways.`);
    infoLog.info(`User ${message.author.username} set active giveaway channel to ${message.channel.name}.`);

    return codes.MESSAGE_ACCEPTED;

};