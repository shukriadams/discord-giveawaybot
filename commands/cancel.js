/**
 * cancel an active giveaway if you are admin, or if competition hasn't started yet and you created it
 *
 * Command :
 * cancel {ID}
 */
let argParser = require('minimist-string'),
    Store = require('./../utils/store'),
    codes = require('./../utils/codes'),
    recordFetch = require('./../utils/recordFetch'),
    channelProvider = require('./../utils/channelProvider'),
    Settings = require('./../utils/settings'),
    messages = require('./../utils/messages'),
    infoLog = require('./../utils/logger').info,
    hi = require('./../utils/highlight'),
    permissionHelper = require('./../utils/permissionHelper');

module.exports = async function (client, message, messageText){

    let store = await Store.instance(),
        settings = Settings.instance(),
        args = argParser(messageText);

    if (args.id){

        // ensure int
        if (isNaN(args.id)){
            message.author.send(`${hi(args.id)} is not a valid id.`);
            return codes.MESSAGE_REJECTED_INVALIDINT;
        }

        let giveaway = store.get(args.id);
        if (!giveaway){
            message.author.send(`Giveaway with id ${hi(args.id)} does not exist.`);
            return codes.MESSAGE_REJECTED_GIVEAWAYNOTFOUND;
        }

        // if user is giveaway creator or an admin, allow cancel
        let isAdmin = await permissionHelper.isAdmin(client, message.author);
        if (giveaway.ownerId !== message.author.id && !isAdmin){
            message.author.send(messages.permissionError);
            return codes.MESSAGE_REJECTED_PERMISSION;
        }

        if (giveaway.status !== 'pending' && giveaway.status !== 'open'){
            message.author.send('Cancel failed - that giveaway has already finished.');
            return codes.MESSAGE_REJECTED_GIVEAWAYCLOSED;
        }

        giveaway.status = 'cancelled';
        giveaway.ended = new Date().getTime();
        store.update(giveaway);

        // find and delete giveaway message. this won't be necessary if the giveaway hasn't started yet
        let channel = channelProvider(client, settings);
        if (channel && giveaway.startMessageId) {
            let giveAwayMessage = await recordFetch.fetchMessage(channel, giveaway.startMessageId);
            if (giveAwayMessage)
                giveAwayMessage.delete();

            let urlMessage = await recordFetch.fetchMessage(channel, giveaway.urlMessageId);
            if (urlMessage)
                urlMessage.delete();
        }

        message.author.send('Giveaway cancelled.');
        infoLog.info(`User ${message.author.username} cancelled giveaway ${args.id} - ${giveaway.steamName}.`);
        return codes.MESSAGE_ACCEPTED;
    }

    if (args.h || args.help){
        message.author.send(
            `${hi('cancel')} stops an ongoing or queued giveaway. Only admins or the giveaway creator can cancel a giveaway.\n\n` +
            `Expected : ${hi('cancel --id giveawayId')} \n`+
            `Example : ${hi('cancel --id 5')} \n\n`+
            `To get a giveaway id try the ${hi('list')} command`
        );
        return codes.MESSAGE_ACCEPTED_HELPRETURNED;
    }

    message.author.send(`Invalid command. Try ${hi('cancel --help')} for more info.`);
    return codes.MESSAGE_REJECTED_INVALIDARGUMENTS;
};