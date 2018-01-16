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
                text: 'Giveaway ended at '
            },
            timestamp: new Date()
        }});

        let infoLog = Logger.instance().info;
        infoLog.info(`Giveaway closed - ID ${giveaway.id} - ${giveaway.gameName}.`);
    }
};