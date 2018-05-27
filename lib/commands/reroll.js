// reroll ID : rerolls the winner of a competition, cancelled winners cannot win again, only admins can reroll

let Store = require('../store'),
    codes = require('../codes'),
    hi = require('../highlight'),
    recordFetch = require('../recordFetch'),
    Logger = require('../logger'),
    messages = require('../messages'),
    Settings = require('../settings'),
    argsHelper = require('../argsHelper'),
    permissionHelper = require('../permissionHelper'),
    channelProvider = require('../channelProvider'),
    giveawayMessageWriter = require('../giveawayMessageWriter'),
    winnerSelector = require('../winnerSelector');

module.exports = async function (message, messageText){
    let settings = Settings.instance,
        infoLog = Logger.instance().info,
        store = await Store.instance(),
        args = argsHelper.toArgsObject(messageText);

    if (args.h) args.help = true;
    if (args.i) args.id = args.i;

    if (args.help){
        await message.author.send(
            `${hi('reroll')} randomly selects another winner for a giveaway. It can be used only by admins or the giveaway creator.\n\n` +
            `Expected: ${hi('reroll --id giveawayid')}\n` +
            `Example: ${hi('reroll --id 5')}\n` +
            `To get a giveaway id try the ${hi('list')} command`
        );
        return codes.MESSAGE_ACCEPTED_HELPRETURNED;
    }

    if (!args.id){
        await message.author.send(`Invalid reroll command.`);
        return codes.MESSAGE_REJECTED_INVALIDARGUMENTS;
    }

    // ensure int
    if (isNaN(args.id)){
        await message.author.send(`${hi(args.id)} is not a valid giveaway id - only numbers are allowed.`);
        return codes.MESSAGE_REJECTED_INVALIDINT;
    }

    let giveaway = store.get(args.id);
    if (!giveaway){
        await message.author.send(`No giveaway with id ${hi(args.id)} could be found. Use ${hi('list')} to find giveaway id's.`);
        return codes.MESSAGE_REJECTED_GIVEAWAYNOTFOUND;
    }

    // if user is giveaway creator or an admin, allow cancel
    let isAdmin = await permissionHelper.isAdmin(message.client, message.author);
    if (giveaway.ownerId !== message.author.id && !isAdmin){
        await message.author.send(messages.permissionError);
        return codes.MESSAGE_REJECTED_PERMISSION;
    }

    // ensures that giveaway is complete
    if (giveaway.status !== 'closed') {
        await message.author.send('Only a closed giveaway can be rerolled.');
        return codes.MESSAGE_REJECTED_NOTCLOSED;
    }

    // pick a random winner
    if (!giveaway.participants.length){
        await message.author.send('This giveaway has no participants, rerolling is not possible.');
        return codes.MESSAGE_REJECTED_NOPARTICIPANTS;
    }

    if (giveaway.rejectedWinners.length === giveaway.participants.length){
        await message.author.send('All participants in this giveaway have already been rejected, rerolling is not possible.');
        return codes.MESSAGE_REJECTED_NOAVAILABLEPARTICIPANTS;
    }

    await winnerSelector(giveaway);

    store.update(giveaway);

    infoLog.info(`User ${message.author.username} rerolled on giveaway id ${giveaway.id} -  ${giveaway.gameName}.`);

    if (giveaway.winnerId){
        let user = await message.client.fetchUser(giveaway.winnerId);
        await message.author.send(`Giveaway winner is now ${hi(user.username)}.`);
        infoLog.info(`User ${user.username} won reroll for giveaway id ${giveaway.id} -  ${giveaway.gameName}.`);

        // update giveaway message
        let channel = channelProvider(message.client, settings);
        let giveAwayMessage = await recordFetch.fetchMessage(channel, giveaway.startMessageId);
        await giveawayMessageWriter.writeWinner(giveAwayMessage, giveaway);

        // broadcast winning, send message to user
        await giveawayMessageWriter.sendWinnerMessages(message.client, giveaway, user);
    } else {
        await message.author.send('Failed to assign new winner to giveaway. This giveaway currently has no winner.');
    }

    return codes.MESSAGE_ACCEPTED;

};