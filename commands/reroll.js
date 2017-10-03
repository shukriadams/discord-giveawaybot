// reroll ID : rerolls the winner of a competition, cancelled winners cannot win again, only admins can reroll

let Store = require('./../utils/store'),
    codes = require('./../utils/codes'),
    hi = require('./../utils/highlight'),
    infoLog = require('./../utils/logger').info,
    messages = require('./../utils/messages'),
    permissionHelper = require('./../utils/permissionHelper'),
    winnerSelector = require('./../utils/winnerSelector');

module.exports = async function (client, message, messageText){
    return new Promise(async function(resolve, reject){
        try {

            let store = await Store.instance();
            let args = messageText.split(' ');

            if (args.length !== 2){
                message.author.send(`Invalid reroll command. Expected : ${hi('reroll [giveaway id]')}.`);
                return resolve(codes.MESSAGE_REJECTED_INVALIDARGUMENTS);
            }

            let giveawayId = args[1];

            // ensure int
            if (isNaN(giveawayId)){
                message.author.send(`${hi(giveawayId)} is not a valid giveaway id - only numbers are allowed.`);
                return resolve(codes.MESSAGE_REJECTED_INVALIDINT);
            }

            let giveaway = store.get(giveawayId);
            if (!giveaway){
                message.author.send(`No giveaway with id ${hi(giveawayId)} could be found. Use ${hi('list')} to find giveaway id's.`);
                return resolve(codes.MESSAGE_REJECTED_GIVEAWAYNOTFOUND);
            }

            // if user is giveaway creator or an admin, allow cancel
            let isAdmin = await permissionHelper.isAdmin(client, message.author);
            if (giveawayId.ownerId !== message.author.id && !isAdmin){
                message.author.send(messages.permissionError);
                return resolve(codes.MESSAGE_REJECTED_PERMISSION);
            }

            // ensures that giveaway is complete
            if (giveaway.status !== 'closed') {
                message.author.send('Only a closed giveaway can be rerolled.');
                return resolve(codes.MESSAGE_REJECTED_NOTCLOSED);
            }

            // pick a random winner
            if (!giveaway.participants.length){
                message.author.send('This giveaway has no participants, rerolling is not possible.');
                return resolve(codes.MESSAGE_REJECTED_NOPARTICIPANTS);
            }

            if (giveaway.rejectedWinners.length === giveaway.participants.length){
                message.author.send('All participants in this giveaway have already been rejected, rerolling is not possible.');
                return resolve(codes.MESSAGE_REJECTED_NOAVAILABLEPARTICIPANTS);
            }

            await winnerSelector(giveaway);

            store.update(giveaway);

            infoLog.info(`User ${message.author.username} rerolled on giveaway id ${giveaway.id} -  ${giveaway.steamName}.`);

            if (giveaway.winnerId){
                let user = await client.fetchUser(giveaway.winnerId);
                message.author.send(`Giveaway winner is now ${hi(user.username)}.`);
                infoLog.info(`User ${user.username} won reroll for giveaway id ${giveaway.id} -  ${giveaway.steamName}.`);
            }

            resolve(codes.MESSAGE_ACCEPTED);

        } catch (ex){
            reject(ex);
        }

    });
};