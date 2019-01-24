/**
 * The daemon is the background process of the bot which runs independent of user messages. The daemon starts and
 * ends giveaways, triggers data cleanups and other autonomous activity.
 *
 */
let winston = require('winston'),
    busy = false,
    _instance,
    Store = require('./store'),
    winnerSelector = require('./winnerSelector'),
    channelProvider = require('./channelProvider'),
    Client = require('./clientProvider'),
    giveawayMessageWriter = require ('./giveawayMessageWriter'),
    timeHelper = require('./timeHelper'),
    permissionHelper = require('./permissionHelper'),
    reactionHelper = require('./reactionHelper'),
    State = require('./state'),
    Settings = require('./settings'),
    Logger = require('./logger'),
    codes = require('./codes'),
    recordFetch = require('./recordFetch'),
    CronJob = require('cron').CronJob;

class Daemon {

    constructor(){
        this.started = new Date();
        this.lastUpdateTime = new Date();
        this.willShutdown = false;
    }

    /**
     * Starts the timer loop that calls .tick()
     */
    start(){

        this.infoLog = Logger.instance().info;

        let settings = Settings.instance();

        this.cron = new CronJob(settings.values.daemonInterval, async function daemonCron() {

            try
            {
                // use busy flag to prevent the daemon from running over itself
                if (this.willShutdown)
                    return this.onProcessExpired();

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

    stop(){
        if (this.cron){
            this.cron.stop();
        }
    }

    /**
     * Logic for a single pass of the daemon process. A pass
     * - starts giveaways if their start time is reached,
     * - processes participants in started giveaways
     * - closes elapsed giveaways and assigns winners
     * - misc cleanups
     */
    async tick(){

        let settings = Settings.instance(),
            client = await Client.instance(true),
            state = State.instance(),
            channel = channelProvider(client, settings),
            store = await Store.instance();

        // channel not set, can't proceed, write a state warning and exit
        if (!channel){
            state.add('channel_not_set', 'Giveaway channel not set, or invalid. Please reset channel.');
            return codes.MESSAGE_REJECTED_CHANNELNOTSET;
        }

        // loop through all active (not closed) giveaways, and either start them, move them along, or close them
        let giveaways = store.getActive();
        for (let giveaway of giveaways){

            // Scenario 1) start pending giveaway, giveaway has no designated start time so start immedaitely, or,
            // giveaway's startup time has elapsed
            if (giveaway.status === 'pending' &&
                (!giveaway.startMinutes || timeHelper.minutesSince(giveaway.created) >= giveaway.startMinutes))
            {
                giveaway.started = new Date().getTime();

                // broadcast start to channel- post url of game
                let urlMessageId = await channel.send(giveaway.gameUrl);

                let giveAwayMessage = await giveawayMessageWriter.writeNew(client, giveaway);

                giveaway.urlMessageId = urlMessageId.id;
                giveaway.startMessageId = giveAwayMessage.id;
                giveaway.status = 'open';
                store.update(giveaway);

                // post first response
                await giveAwayMessage.react(settings.values.joinGiveawayResponseCharacter);
                continue;
            }

            // from this point on, we only care about open giveaways
            if (giveaway.status !== 'open')
                continue;


            // Scenario 2 ) the giveaway is running ... do something with it
            let giveAwayMessage = await recordFetch.fetchMessage(channel, giveaway.startMessageId);

            // if broadcast message no longer exists, close giveaway immediately
            if (!giveAwayMessage){
                giveaway.status = 'cancelled';
                giveaway.comment = 'Giveaway message not found';
                giveaway.ended = new Date().getTime();
                store.update(giveaway);

                let urlMessage = await recordFetch.fetchMessage(channel, giveaway.urlMessageId);
                if (urlMessage)
                    await urlMessage.delete();

                continue;
            }


            // gets the participation response
            let participateReaction = giveAwayMessage.reactions.array().find(function(reaction){
                return reaction._emoji.name === settings.values.joinGiveawayResponseCharacter;
            });

            // get participants from reaction, add them to participants array, reject if they are on cooldown for the game's
            // bracket.
            // WARNING : .users is unreliable, but fetchUsers() doesn't allow more than 100 users. replace this with better
            // call when discord updates API
            let participatingUsers = participateReaction ? await reactionHelper.getAllReactionUsers(participateReaction) : [];
            for (let user of participatingUsers){

                // ignore bot's own reaction
                if (user.id === client.user.id)
                    continue;

                // ignore existing participants
                if (giveaway.participants.includes(user.id))
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
                            await participateReaction.remove(user);
                            state.remove('message_permission');
                        } catch(ex){
                            deleteException = ex.toString();
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
                        await user.send(`Sorry, but you can't enter a giveaway for ${giveaway.gameName} because you won ${comparableWinning.gameName} ${daysAgoWon} days ago. These games are in the same price range. You will have to wait ${coolDownLeft} more day(s) to enter this price range again, but you can still enter giveaways in other price ranges.`);

                        // log exception here to prevent flooding
                        if (deleteException)
                            this.infoLog.info(`Failed to remove participation emote from user ${user.username} on ${giveaway.id} - ${giveaway.gameName} (this exception will be logged once per user per giveaway) : ${deleteException}`);
                    }

                    this.infoLog.info(`${user.username} was on cooldown, removed from giveaway ID ${giveaway.id} - ${giveaway.gameName}.`);
                    continue;
                }

                giveaway.participants.push(user.id);
                this.infoLog.info(`${user.username} joined giveaway ID ${giveaway.id} - ${giveaway.gameName}.`);

            } // for users in join reaction

            // remove ids of users no longer in reaction list
            giveaway.participants = giveaway.participants.filter(function(userId){
                return participatingUsers.some(function(user){
                    return userId === user.id;
                });
            });

            store.update(giveaway);


            // the giveaway time has elapsed, or maximum participant count is reached, close giveaway
            if (participatingUsers.length >= 100 || timeHelper.minutesSince( giveaway.started) >= giveaway.durationMinutes){

                // if giveaway update failed, giveaway will be reprocessed. Do not reprocess winner in that case,
                // reprocesses will invoke reroll logic
                if (!giveaway.winnerId)
                    await winnerSelector(giveaway);

                // Update original channel post
                await giveawayMessageWriter.writeWinner(giveAwayMessage, giveaway);

                // refetch message as proof of update. This is done because discord.js seems to hang/die on message updates
                giveAwayMessage = await recordFetch.fetchMessage(channel, giveaway.startMessageId);
                let hasUpdated = giveAwayMessage.embeds.some(function(embed){ return embed.footer && embed.footer.text.startsWith('Giveaway ended at')});

                if (hasUpdated){

                    giveaway.status = 'closed';
                    giveaway.ended = new Date().getTime();

                    // get winner if there is one
                    let winner = giveaway.winnerId ? await recordFetch.fetchUser(client, giveaway.winnerId) : null;

                    // failed to get winner user object from discord, this should never happen
                    if (giveaway.winnerId && !winner)
                        this.infoLog.error(`${giveaway.winnerId} won giveaway ID ${giveaway.id} - ${giveaway.gameName}, failed to retrieve user from discord`);

                    if (winner)
                        giveawayMessageWriter.sendWinnerMessages(client, giveaway, winner);

                    // send a message to game creator
                    let owner = await recordFetch.fetchUser(client, giveaway.ownerId);
                    if (owner){
                        let ownerMessage = `Giveaway for ${giveaway.gameName} ended.`;

                        if (winner)
                            ownerMessage += `The winner was <@${giveaway.winnerId}>.`;
                        else if (giveaway.winnerId && !winner)
                            ownerMessage += `Er, looks like we lost the winner (discord id: <@${giveaway.winnerId}>).`;
                        else
                            ownerMessage += 'No winner was found.';

                        await owner.send(ownerMessage);
                    }

                    store.update(giveaway);
                    continue;
                }

            }

            // if reach here, giveaway is still active, update its timer
            let minutesSinceUpdate = timeHelper.minutesSince(giveaway.lastUpdated);
            if (minutesSinceUpdate >= 1){

                await giveawayMessageWriter.writeUpdate(client, giveaway, giveAwayMessage);

                giveAwayMessage.lastUpdated = new Date().getTime();
                store.update(giveaway);
            }

        } // for

        // clean old giveaways
        store.clean();

        // update health monitor
        this.lastUpdateTime = new Date();

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
