// list : list everything
let dateFormat = require('dateformat'),
    permissionHelper = require('./../utils/permissionHelper'),
    timeHelper = require('./../utils/timeHelper'),
    Store = require('./../utils/store'),
    codes = require('./../utils/codes'),
    hi = require('./../utils/highlight'),
    messages = require('./../utils/messages');

module.exports = async function (client, message, messageText){

    let args = messageText.split(' ');
    if (args.length > 2){
        message.author.send(messages.listArgumentsError);
        return codes.MESSAGE_REJECTED_INVALIDARGUMENTS;
    }

    let listSwitch = null;
    if (args.length === 2){
        listSwitch = args[1].toLowerCase();
        if (listSwitch !== 'all'){
            message.author.send(messages.listArgumentsError);
            return codes.MESSAGE_REJECTED_INVALIDARGUMENTS;
        }
    }

    let store = await Store.instance();

    // discord message size limit is 2000 chars, to prevent list from breaking this we split
    // reply into chunks string array
    let giveaways = store.list(),
        chunks = [];

    if (listSwitch !== 'all')
        giveaways = giveaways.filter(function(giveaway){
            return giveaway.status === 'closed' || giveaway.status === 'cancelled' ? null: giveaway;
        });

    let isAdmin = await permissionHelper.isAdmin(client, message.author);

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
                `id: ${giveaway.id} steamId:${giveaway.steamId} ${giveaway.steamName} ${dateCreated} ` +
                ` ${giveaway.participants.length} participants`;

            if (giveaway.status === 'pending') {
                chunk += ' starts at ' + timeHelper.timePlusMinutes(giveaway.created, giveaway.start);
            } else if (giveaway.status === 'open') {
                chunk += ' ends at ' + timeHelper.timePlusMinutes(giveaway.started, giveaway.duration);
            } else if (giveaway.status === 'closed') {
                let span = timeHelper.timespan(created, giveaway.ended);

                created.setMinutes(created.getMinutes() + giveaway.ended);
                chunk +=` ended ${dateCreated} ran for ${span}`;
            }

            if (giveaway.winnerId) {
                chunk += ` winner: <@${giveaway.winnerId}>`;
            }

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
        if (listSwitch !== 'all' && isAdmin)
            reply += ` You can also try ${hi('list all')} to view old giveaways.`;

        chunks.push(reply);
    }

    for (let chunk of chunks)
        await message.author.send(chunk);

    return codes.MESSAGE_ACCEPTED;

};
