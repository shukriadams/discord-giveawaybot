/**
 * The daemon is the background process of the bot which runs independent of user messages. The daemon starts and
 * ends giveaways, triggers data cleanups and other autonomous activity.
 */
let Store = require('./store'),
    winnerSelector = require('./winnerSelector'),
    channelProvider = require('./channelProvider'),
    giveawayMessageWriter = require ('./giveawayMessageWriter'),
    steamUrl = require('./steamUrl'),
    timeHelper = require('./timeHelper'),
    Settings = require('./settings'),
    Client = require('./clientProvider');
    infoLog = require('./logger').info,
    recordFetch = require('./recordFetch'),
    winston = require('winston'),
    busy = false,
    CronJob = require('cron').CronJob;

module.exports = async function daemon (){

    let settings = Settings.instance(),
        client = Client.instance();


    // every 5 seconds
    new CronJob('*/5 * * * * *', async function daemonCron() {

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
                        let urlMessageId = await channel.send(giveaway.gameUrl);

                        let giveAwayMessage = await giveawayMessageWriter.writeNew(client, giveaway);

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

                                // Note - this can fail if the bot doesn't have permission do delete a reaction, but it shouldn't throw an exception
                                reaction.remove(user);

                                // inform user of removal once only. This mechanism is purely for flooding protection in event of the removal failing
                                // reaction
                                if (giveaway.cooldownUsers.indexOf(user.id) === -1){
                                    giveaway.cooldownUsers.push(user.id);
                                    let daysAgoWon = timeHelper.daysSince(comparableWinning.ended);
                                    let coolDownLeft = settings.values.winningCooldownDays - daysAgoWon;
                                    user.send(`Sorry, but you can't enter a giveaway for ${giveaway.gameName} because you won ${comparableWinning.gameName} ${daysAgoWon} days ago. These games are in the same price range. You will have to wait ${coolDownLeft} more days to enter this price range again, but you can still enter giveaways in other price ranges.`);
                                }
                                infoLog.info(`${user.username} was on cooldown, removed from giveaway ID ${giveaway.id} - ${giveaway.gameName}.`);
                                continue;
                            }

                            giveaway.participants.push(user.id);
                            infoLog.info(`${user.username} joined giveaway ID ${giveaway.id} - ${giveaway.gameName}.`);

                        }
                    } // for
                    store.update(giveaway);


                    // close giveaway
                    if (timeHelper.minutesSince( giveaway.started) >= giveaway.durationMinutes){

                        await winnerSelector(giveaway);

                        giveaway.status = 'closed';
                        giveaway.ended = new Date().getTime();
                        store.update(giveaway);

                        // Update original channel post
                        giveawayMessageWriter.writeWinner(giveAwayMessage, giveaway);

                        // post public congrats message to winner in giveaway channel
                        if (giveaway.winnerId)
                            await channel.send(`Congratulations <@${giveaway.winnerId}>, you won the draw for ${giveaway.gameName}!`);

                        let winner = await recordFetch.fetchUser(client,giveaway.winnerId);
                        // log winner
                        if (winner){
                            let winner = await recordFetch.fetchUser(client, giveaway.winnerId);
                            infoLog.info(`${winner.username} won initial roll for giveaway ID ${giveaway.id} - ${giveaway.gameName}.`);
                        }

                        // send direct message to winner
                        if (winner){
                            let winnerMessage = `Congratulations, you just won ${giveaway.gameName}, courtesy of <@${giveaway.ownerId}>.`;
                            if (giveaway.code){
                                winnerMessage += `Your game key is ${giveaway.code}.`;
                            } else {
                                winnerMessage += 'Contact them for your game key.';
                            }
                            winner.send(winnerMessage);
                        }

                        // send a message to game creator
                        let owner = await recordFetch.fetchUser(client, giveaway.ownerId);
                        if (owner){
                            let ownerMessage = `Giveaway for ${giveaway.gameName} ended.`;
                            if (winner)
                                ownerMessage += `The winner was <@${giveaway.winnerId}>.`;
                            else
                                ownerMessage += 'No winner was found.';
                            owner.send(ownerMessage);
                        }

                    } else {

                        // giveaway is still active, update timer
                        let minutesSinceUpdate = timeHelper.minutesSince(giveaway.lastUpdated);
                        if (minutesSinceUpdate >= 1){

                            giveawayMessageWriter.writeUpdate(client, giveaway, giveAwayMessage);

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

