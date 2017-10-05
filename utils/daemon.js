/**
 * The daemon is the background process of the bot which runs independent of user messages. The daemon starts and
 * ends giveaways, triggers data cleanups and other autonomous activity.
 */
let Store = require('./store'),
    winnerSelector = require('./winnerSelector'),
    channelProvider = require('./channelProvider'),
    steamUrl = require('./steamUrl'),
    timeHelper = require('./timeHelper'),
    settings = require('./../utils/settings').instance(),
    client = require('./../utils/clientProvider').instance();
    infoLog = require('./../utils/logger').info,
    recordFetch = require('./recordFetch'),
    winston = require('winston'),
    busy = false,
    CronJob = require('cron').CronJob;

module.exports = async function (){

    /**
     * Constructs a rich embed for a giveaway message
     */
    function createGiveawayEmbed( giveaway){
        let ends = timeHelper.timePlusMinutesAsDate(giveaway.started, giveaway.duration),
            remaining = timeHelper.remaining(new Date().getTime(), ends);

        return {embed: {
            color: 3447003,
            author: {
                name: client.user.username,
            },
            title: `:mega: Giveaway ${giveaway.steamName} :mega:`,
            description: `React with ${settings.values.joinGiveawayResponseCharacter} to enter Time remaining : ${remaining}`,
            fields: [
                {
                    name : 'Given away by',
                    value : `<@${giveaway.ownerId}>`
                }],
            footer: {
                text: 'Giveaway ends at '
            },
            timestamp: ends
        }};
    }

    // every 5 seconds
    new CronJob('*/5 * * * * *', async function() {

        try
        {
            // use busy flag to prevent daemon running concurrent "threads"
            if (busy)
                return;
            busy = true;

            let store = await Store.instance(),
                channel = channelProvider(client, settings);

            // channel not set, can't proceed
            if (!channel)
                return;

            let giveaways = store.getActive();
            for (let giveaway of giveaways){

                // Scenario 1 ) start the giveaway
                if (giveaway.status === 'pending'){
                    if (!giveaway.startMinutes || timeHelper.minutesSince(giveaway.created) >= giveaway.startMinutes){

                        giveaway.started = new Date().getTime();

                        // broadcast start to channel- post url of game
                        let urlMessageId = await channel.send(steamUrl.getUrl(giveaway.steamId));

                        let embed = createGiveawayEmbed(giveaway);
                        let giveAwayMessage = await channel.send( embed );

                        giveaway.urlMessageId = urlMessageId.id;
                        giveaway.startMessageId = giveAwayMessage.id;
                        giveaway.status = 'open';
                        store.update(giveaway);

                        // post first response
                        giveAwayMessage.react(settings.values.joinGiveawayResponseCharacter);
                    }
                }

                // Scenario 2 ) the giveaway is running - update or close it
                if (giveaway.status === 'open'){

                    let giveAwayMessage = await recordFetch.fetchMessage(channel, giveaway.startMessageId);

                    // if message no longer exists, close giveaway immediately
                    if (!giveAwayMessage){
                        giveaway.status = 'cancelled';
                        giveaway.comment = 'Giveaway message not found';
                        giveaway.ended = new Date().getTime();
                        store.update(giveaway);

                        let urlMessage = await recordFetch.fetchMessage(channel, giveaway.urlMessageId);
                        if (urlMessage)
                            urlMessage.delete();

                        continue;
                    }

                    // process participants - find latest participants, add them to participants array, reject if they
                    // are on cooldown for the game's bracket
                    for (let reaction of giveAwayMessage.reactions.array()){

                        if (reaction._emoji.name !== settings.values.joinGiveawayResponseCharacter)
                            continue;

                        for (let user of reaction.users.array()){

                            // ignore bot's own reaction
                            if (user.id === client.user.id)
                                continue;

                            // ignore existing participants
                            if (giveaway.participants.indexOf(user.id) !== -1)
                                continue;

                            // remove users not eligible to enter
                            let comparableWinning = store.getComparableWinning(user.id, giveaway.price);
                            if (comparableWinning){
                                reaction.remove(user);
                                user.send(`Sorry, but you can't enter a giveaway in this price range because you recently won ${comparableWinning.steamName}.`);
                                infoLog.info(`${user.username} was on cooldown, removed from giveaway ID ${giveaway.id} - ${giveaway.steamName}.`);
                                continue;
                            }

                            giveaway.participants.push(user.id);
                            infoLog.info(`${user.username} joined giveaway ID ${giveaway.id} - ${giveaway.steamName}.`);

                        }
                    }
                    store.update(giveaway);


                    // close giveaway
                    if (timeHelper.minutesSince( giveaway.started) >= giveaway.durationMinutes){

                        await winnerSelector(giveaway);

                        giveaway.status = 'closed';
                        giveaway.ended = new Date().getTime();
                        store.update(giveaway);

                        // Update original channel post
                        giveAwayMessage.edit( { embed : {
                            title: `:mega: Giveaway ${giveaway.steamName} ended :mega:`,
                            fields: [
                                {
                                    name : 'Given away by',
                                    value : `<@${giveaway.ownerId}>`
                                },
                                {
                                    name : 'Results',
                                    value : giveaway.winnerId ? `<@${giveaway.winnerId}> won` : 'No winner found'
                                }],
                            footer: {
                                text: 'Giveaway ended at '
                            },
                            timestamp: new Date()
                        }});

                        infoLog.info(`Giveaway closed - ID ${giveaway.id} - ${giveaway.steamName}.`);

                        // post public congrats message to winner in giveaway channel
                        if (giveaway.winnerId){
                            let winnerMessage;
                            if (giveaway.code)
                                winnerMessage = `Congratulations <@${giveaway.winnerId}>, you won the draw! Check your DMs for the key.`;
                            else
                                winnerMessage = `Congratulations <@${giveaway.winnerId}>, you won the draw! ` +
                                    `Contact <@${giveaway.ownerId}> for your game.`;

                            await channel.send(winnerMessage);
                            let winner = await recordFetch.fetchUser(client, giveaway.winnerId);
                            infoLog.info(`${winner.username} won initial roll for giveaway ID ${giveaway.id} - ${giveaway.steamName}.`);
                        }

                        // send direct message to winner if prize has an activation code
                        if (giveaway.winnerId && giveaway.code){
                            let winner = await recordFetch.fetchUser(client,giveaway.winnerId );
                            if (winner)
                                winner.send(`Your game key for ${giveaway.steamName} is ${giveaway.code} ... have fun!`);
                        }

                    } else {

                        // giveaway is still active, update timer
                        let minutesSinceUpdate = timeHelper.minutesSince(giveaway.lastUpdated);
                        if (minutesSinceUpdate >= 1){

                            let embed = createGiveawayEmbed(giveaway);
                            giveAwayMessage.edit(embed);

                            giveAwayMessage.lastUpdated = new Date().getTime();
                            store.update(giveaway);
                        }
                    }
                }



            } // for

            // clean old giveaways
            store.clean();

        } catch (ex){
            winston.error(ex);
            console.log(ex);
        } finally {
            busy = false;
        }


    },  null, true);

};

