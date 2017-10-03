// cancel ID : cancel an active giveaway if you are admin, or if competition hasn't started yet and you created it

let settings = require('./../utils/settings').instance(),
    codes = require('./../utils/codes'),
    messages = require('./../utils/messages'),
    infoLog = require('./../utils/logger').info,
    hi = require('./../utils/highlight'),
    permissionHelper = require('./../utils/permissionHelper');

module.exports = async function (client, message){
    return new Promise(async function(resolve, reject){
        try {

            let isAdmin = await permissionHelper.isAdmin(client, message.author);
            if (!isAdmin){
                message.author.send(messages.permissionError);
                return resolve(codes.MESSAGE_REJECTED_PERMISSION);
            }

            if (message.channel.type === 'dm'){
                message.author.send('Only a public channel can be used for giveaways.');
                return resolve(codes.MESSAGE_REJECTED_INVALIDCHANNEL);
            }

            settings.values.giveawayChannelId = message.channel.id;
            settings.save();

            message.reply(`The channel ${hi(message.channel.name)} will now be used for giveaways.`);
            resolve(codes.MESSAGE_ACCEPTED);
            infoLog.info(`User ${message.author.username} set active giveaway channel to ${message.channel.name}.`);

        } catch (ex){
            reject(ex);
        }

    });
};