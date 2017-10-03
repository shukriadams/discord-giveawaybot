/**
 * cancel an active giveaway if you are admin, or if competition hasn't started yet and you created it
 *
 * Command :
 * cancel {ID}
 */
let Store = require('./../utils/store'),
    codes = require('./../utils/codes'),
    recordFetch = require('./../utils/recordFetch'),
    channelProvider = require('./../utils/channelProvider'),
    settings = require('./../utils/settings').instance(),
    messages = require('./../utils/messages'),
    infoLog = require('./../utils/logger').info,
    hi = require('./../utils/highlight'),
    permissionHelper = require('./../utils/permissionHelper');

module.exports = async function (client, message, messageText){
    return new Promise(async function(resolve, reject){

        try {

            let store = await Store.instance(),
                args = messageText.split(' ');

            if (args.length !== 2){
                message.author.send(`Invalid cancel command. Expected : ${hi('cancel [giveawayid]')}. You can get giveawayids by using the ${hi('list')} command.`);
                return resolve(codes.MESSAGE_REJECTED_INVALIDARGUMENTS);
            }

            let giveawayId = args[1];

            // ensure int
            if (isNaN(giveawayId)){
                message.author.send(`${hi(giveawayId)} is not a valid id.`);
                return resolve(codes.MESSAGE_REJECTED_INVALIDINT);
            }

            let giveaway = store.get(giveawayId);
            if (!giveaway){
                message.author.send(`Giveaway with id ${hi(giveawayId)} does not exist.`);
                return resolve(codes.MESSAGE_REJECTED_GIVEAWAYNOTFOUND);
            }

            // if user is giveaway creator or an admin, allow cancel
            let isAdmin = await permissionHelper.isAdmin(client, message.author);
            if (giveaway.ownerId !== message.author.id && !isAdmin){
                message.author.send(messages.permissionError);
                return resolve(codes.MESSAGE_REJECTED_PERMISSION);
            }

            if (giveaway.status !== 'pending' && giveaway.status !== 'open'){
                message.author.send('Cancel failed - that giveaway has already finished.');
                return resolve(codes.MESSAGE_REJECTED_GIVEAWAYCLOSED);
            }

            giveaway.status = 'cancelled';
            giveaway.ended = new Date().getTime();
            store.update(giveaway);

            // find and delete giveaway message
            let channel = channelProvider(client, settings);
            if (channel) {
                let giveAwayMessage = await recordFetch.fetchMessage(channel, giveaway.startMessageId);
                if (giveAwayMessage)
                    giveAwayMessage.delete();

                let urlMessage = await recordFetch.fetchMessage(channel, giveaway.urlMessageId);
                if (urlMessage)
                    urlMessage.delete();
            }

            message.author.send('Giveaway cancelled.');
            resolve(codes.MESSAGE_ACCEPTED);
            infoLog.info(`User ${message.author.username} cancelled giveaway ${giveawayId} - ${giveaway.steamName}.`);

        } catch (ex){
            reject(ex);
        }

    });
};