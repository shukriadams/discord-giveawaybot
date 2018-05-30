let Logger = require('./logger'),
    Settings = require('./settings'),
    channelProvider = require('./channelProvider'),
    timeHelper = require('./timeHelper');

module.exports = {
    /**
     * Constructs a rich embed for a giveaway message
     */
    createGiveawayEmbed : function (client, giveaway){
        let settings = Settings.instance(),
            ends = timeHelper.timePlusMinutesAsDate(giveaway.started, giveaway.durationMinutes),
            remaining = timeHelper.remaining(new Date().getTime(), ends);

        return {embed: {
            color: 3447003,
            author: {
                name: client.user.username,
            },
            title: `:mega: Giveaway ${giveaway.gameName} :mega:`,
            description: `React with ${settings.values.joinGiveawayResponseCharacter} to enter, time remaining : ${remaining}`,
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
    },

    writeNew : async function(client, giveaway){
        let settings = Settings.instance(),
            channel = channelProvider(client, settings),
            embed = this.createGiveawayEmbed(client, giveaway);

        return await channel.send( embed );
    },

    writeUpdate : async function(client, giveaway, giveAwayMessage){
        let embed = this.createGiveawayEmbed(client, giveaway);
        await giveAwayMessage.edit(embed);
    },

    /**
     * Writes the state of the giveaway back to its original message on discord
     */
    writeWinner : async function(giveawayMessage, giveaway){
        await giveawayMessage.edit( { embed : {
            title: `:mega: Giveaway ${giveaway.gameName} ended :mega:`,
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
                // WARNING : this text is also used as a flag to indicate successful message update. If changed, check
                // daemon logic for update confirm
                text: 'Giveaway ended at '
            },
            timestamp: new Date()
        }});

        let infoLog = Logger.instance().info;
        infoLog.info(`Giveaway closed - ID ${giveaway.id} - ${giveaway.gameName}.`);
    },

    /**
     * Handles all messaging logic when a giveaway is won, or rerolled and won.
     */
    sendWinnerMessages : async function(client, giveaway, winner){
        let settings = Settings.instance(),
            channel = channelProvider(client, settings);

        // post public congrats message to winner in giveaway channel
        await channel.send(`Congratulations <@${giveaway.winnerId}>, you won the draw for ${giveaway.gameName}! `);

        // send direct message to winner
        let winnerMessage = `Congratulations, you just won ${giveaway.gameName}, courtesy of <@${giveaway.ownerId}>. `;

        if (giveaway.code)
            winnerMessage += `Your game key is ${giveaway.code}, be sure to thank <@${giveaway.ownerId}> for the giveaway!`;
        else
            winnerMessage += 'Contact them for your game key. ';

        await winner.send(winnerMessage);

        let infoLog = Logger.instance().info;
        infoLog.info(`${winner.username} won initial roll for giveaway ID ${giveaway.id} - ${giveaway.gameName}.`);
    }
};