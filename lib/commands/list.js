// list : list everything
let dateFormat = require('dateformat'),
    permissionHelper = require('./../permissionHelper'),
    Settings = require('./../settings'),
    argsHelper = require('../argsHelper'),
    timeHelper = require('./../timeHelper'),
    Store = require('./../store'),
    codes = require('./../codes'),
    Trace = require('./../trace'),
    hi = require('./../highlight');

module.exports = async function (message, messageText){
    let settings = Settings.instance(),
        args = argsHelper.toArgsObject(messageText),
        trace = Trace.instance(),
        store = await Store.instance();

    // discord message size limit is 2000 chars, to prevent list from breaking this we split
    // reply into 2000-character chunks
    let giveaways = store.list(),
        chunks = [];

    if (args.h) args.help = true;

    if (args.help)
        return await message.reply(trace(
            `${hi('list')} returns a list of giveaways.\n\n` +
            `Expected: ${hi('list')} lists giveaways that are currently ongoing. \n` +
            `Expected: ${hi('list --all')} lists current and completed giveaways up to ${settings.values.deleteGiveawaysAfter} days ago. \n`,
            codes.MESSAGE_ACCEPTED_HELPRETURNED));

    if (!args.all)
        giveaways = giveaways.filter(function(giveaway){
            return giveaway.status === 'closed' || giveaway.status === 'cancelled' ? null: giveaway;
        });

    let isAdmin = await permissionHelper.isAdmin(message.client, message.author);

    if (giveaways.length){

        giveaways = giveaways.sort(function(a,b){
            return a.created < b.created ? 1 :
                a.created > b.created ? -1 :
                    0;
        });

        for (let giveaway of giveaways){

            // pending giveaways are visible only to admins and authors
            if (giveaway.status === 'pending' && !giveaway.ownerId !== message.author.id && !isAdmin)
                continue;

            let chunk = '',
                created = new Date(giveaway.created),
                dateCreated = dateFormat(created, 'mmm dS h:MM');

            chunk +=
                `id: ${giveaway.id} ${giveaway.gameName} ${dateCreated}, ` +
                ` ${giveaway.participants.length} participants, `;

            if (giveaway.status === 'pending') {
                chunk += ' Starts at ' + timeHelper.timePlusMinutes(giveaway.created, giveaway.start);
            } else if (giveaway.status === 'open') {
                chunk += ' Ends at ' + timeHelper.timePlusMinutes(giveaway.started, giveaway.durationMinutes);
            } else if (giveaway.status === 'closed') {

                let span = timeHelper.timespan(created, giveaway.ended);
                created.setMinutes(created.getMinutes() + giveaway.ended);
                chunk +=` Ended ${dateCreated} ran for ${span}`;

            } else if (giveaway.status === 'cancelled') {
                let cancelledDate = timeHelper.toShortDateTimeString(giveaway.ended);
                chunk +=` Cancelled at ${cancelledDate}.`;
            }

            if (giveaway.winnerId)
                chunk += ` Winner: <@${giveaway.winnerId}>`;

            chunk += '\n\n';

            // max discord message length is 2000 chars
            // add chunk to chunks array, either as new item, or appended to last item.
            if (!chunks.length || chunks[chunks.length - 1].length + chunk.length >= 2000){
                chunks.push(chunk);
            } else
                chunks[chunks.length -1] += chunk;

        } // for

    } else {
        let reply = `No giveaways found - create one with the ${hi('start')} or ${hi('queue')} commands.`;
        if (!args.all)
            reply += ` You can also try ${hi('list --all')} to view ongoing and completed giveaways.`;

        chunks.push(reply);
    }

    for (let chunk of chunks)
        await message.author.send(chunk);

    trace(codes.MESSAGE_ACCEPTED);
};
