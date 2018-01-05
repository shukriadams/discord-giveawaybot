/**
 * The daemon is the background process of the bot which runs independent of user messages. The daemon starts and
 * ends giveaways, triggers data cleanups and other autonomous activity.
 */
let winston = require('winston'),
    busy = false,
    _instance,
    Store = require('./store'),
    winnerSelector = require('./winnerSelector'),
    channelProvider = require('./channelProvider'),
    giveawayMessageWriter = require ('./giveawayMessageWriter'),
    timeHelper = require('./timeHelper'),
    permissionHelper = require('./permissionHelper'),
    State = require('./state'),
    Settings = require('./settings'),
    infoLog = require('./logger').info,
    codes = require('./codes'),
    recordFetch = require('./recordFetch'),
    Client = require('./clientProvider'),
    CronJob = require('cron').CronJob;

class Daemon {

    start(){
        // every 5 seconds
        new CronJob('*/5 * * * * *', async function daemonCron() {

            try
            {
                // use busy flag to prevent the daemon from running over itself
                if (busy)
                    return;
                busy = true;

                await this.tick();

            } catch (ex){
                winston.error(ex);
                console.log(ex);
            } finally {
                busy = false;
            }

        }.bind(this),  null, true);
    }

    /**
     * Contains logic for daemon process
     */
    async tick(){

        let settings = Settings.instance(),
            state = State.instance(),
            client = Client.instance(),
            channel = channelProvider(client, settings),
            store = await Store.instance();

        // channel not set, can't proceed
        if (!channel){
            state.add('channel_not_set', 'Giveaway channel not set, or invalid. Please reset channel.');
            return codes.MESSAGE_REJECTED_CHANNELNOTSET;
        }

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

                    // WARNING : reaction.users is unreliable, but fetchUsers() doesn't allow more than 100 users.
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

                            let canManageMessages = await permissionHelper.canManageMessages(client, client.user);

                            // try to delete user response, this will fail if the bot doesn't permission to, if so
                            // write a status message
                            let deleteException;
                            if (canManageMessages){
                                try{
                                    await reaction.remove(user);
                                    state.remove('message_permission');
                                } catch(ex){
                                    deleteException = ex;
                                }
                            }
                            else {
                                state.add('message_permission', 'Cannot delete user responses, pleased give me permission "Manage Messages".');
                            }

                            // inform user of removal once only. This mechanism is purely for flooding protection in event of the removal failing
                            // reaction
                            if (giveaway.cooldownUsers.indexOf(user.id) === -1){
                                giveaway.cooldownUsers.push(user.id);
                                let daysAgoWon = timeHelper.daysSince(comparableWinning.ended);
                                let coolDownLeft = settings.values.winningCooldownDays - daysAgoWon;
                                user.send(`Sorry, but you can't enter a giveaway for ${giveaway.gameName} because you won ${comparableWinning.gameName} ${daysAgoWon} days ago. These games are in the same price range. You will have to wait ${coolDownLeft} more days to enter this price range again, but you can still enter giveaways in other price ranges.`);

                                // log exception here to prevent flooding
                                if (deleteException)
                                    infoLog.info(`Failed to remove participation emote from user ${user.username} on ${giveaway.id} - ${giveaway.gameName} (this exception will be logged once per user per giveaway) : ${deleteException}`);
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
                    let winner = null;
                    if (giveaway.winnerId){
                        await channel.send(`Congratulations <@${giveaway.winnerId}>, you won the draw for ${giveaway.gameName}!`);
                        winner = await recordFetch.fetchUser(client,giveaway.winnerId);
                    }

                    // log winner
                    if (winner){
                        let winner = await recordFetch.fetchUser(client, giveaway.winnerId);
                        infoLog.info(`${winner.username} won initial roll for giveaway ID ${giveaway.id} - ${giveaway.gameName}.`);

                        // send direct message to winner
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

        return codes.DAEMON_FINISHED;
    }

}

module.exports = {
    instance : function(){
        if (!_instance)
            _instance = new Daemon();

        return _instance;
    },
    set : function(newInstance){
        _instance = newInstance;
    }
};
