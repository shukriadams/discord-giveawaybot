// reroll ID : rerolls the winner of a competition, cancelled winners cannot win again, only admins can reroll

let argParser = require('minimist-string'),
    Store = require('./../utils/store'),
    codes = require('./../utils/codes'),
    hi = require('./../utils/highlight'),
    infoLog = require('./../utils/logger').info,
    messages = require('./../utils/messages'),
    permissionHelper = require('./../utils/permissionHelper'),
    winnerSelector = require('./../utils/winnerSelector');

module.exports = async function (client, message, messageText){
    let store = await Store.instance();
    let args = argParser(messageText);

    if (args.h) args.help = true;
    if (args.help){
        message.author.send(
            `${hi('reroll')} randomly selects another winner for a giveaway. It can be used only by admins or the giveaway creator.\n\n` +
            `Expected: ${hi('reroll --id giveawayid')}\n` +
            `Example: ${hi('reroll --id 5')}\n` +
            `To get a giveaway id try the ${hi('list')} command`
        );
        return codes.MESSAGE_ACCEPTED_HELPRETURNED;
    }

    if (!args.id){
        message.author.send(`Invalid reroll command. `);
        return codes.MESSAGE_REJECTED_INVALIDARGUMENTS;
    }

    // ensure int
    if (isNaN(args.id)){
        message.author.send(`${hi(args.id)} is not a valid giveaway id - only numbers are allowed.`);
        return codes.MESSAGE_REJECTED_INVALIDINT;
    }

    let giveaway = store.get(args.id);
    if (!giveaway){
        message.author.send(`No giveaway with id ${hi(args.id)} could be found. Use ${hi('list')} to find giveaway id's.`);
        return codes.MESSAGE_REJECTED_GIVEAWAYNOTFOUND;
    }

    // if user is giveaway creator or an admin, allow cancel
    let isAdmin = await permissionHelper.isAdmin(client, message.author);
    if (giveaway.ownerId !== message.author.id && !isAdmin){
        message.author.send(messages.permissionError);
        return codes.MESSAGE_REJECTED_PERMISSION;
    }

    // ensures that giveaway is complete
    if (giveaway.status !== 'closed') {
        message.author.send('Only a closed giveaway can be rerolled.');
        return codes.MESSAGE_REJECTED_NOTCLOSED;
    }

    // pick a random winner
    if (!giveaway.participants.length){
        message.author.send('This giveaway has no participants, rerolling is not possible.');
        return codes.MESSAGE_REJECTED_NOPARTICIPANTS;
    }

    if (giveaway.rejectedWinners.length === giveaway.participants.length){
        message.author.send('All participants in this giveaway have already been rejected, rerolling is not possible.');
        return codes.MESSAGE_REJECTED_NOAVAILABLEPARTICIPANTS;
    }

    await winnerSelector(giveaway);

    store.update(giveaway);

    infoLog.info(`User ${message.author.username} rerolled on giveaway id ${giveaway.id} -  ${giveaway.steamName}.`);

    if (giveaway.winnerId){
        let user = await client.fetchUser(giveaway.winnerId);
        message.author.send(`Giveaway winner is now ${hi(user.username)}.`);
        infoLog.info(`User ${user.username} won reroll for giveaway id ${giveaway.id} -  ${giveaway.steamName}.`);
    }

    return codes.MESSAGE_ACCEPTED;

};