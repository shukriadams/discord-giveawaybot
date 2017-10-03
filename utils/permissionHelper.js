let recordFetch = require('./recordFetch'),
    Discord = require('discord.js');

module.exports = {
    isAdmin : async function(client, discordUser){
        let guildMember = await recordFetch.fetchGuildMember(client, discordUser);
        if (!guildMember)
            return false;

        return guildMember.hasPermission(Discord.Permissions.FLAGS.MANAGE_CHANNELS);
    },
    isAdminOrHasRole : async function(client, discordUser, roleName){
        let guildMember = await recordFetch.fetchGuildMember(client, discordUser);
        if (!guildMember)
            return false;

        let isAdmin = guildMember.hasPermission(Discord.Permissions.FLAGS.MANAGE_CHANNELS);
        if (isAdmin)
            return true;

        for (let role of guildMember.roles.array()){
            if (role.name === roleName)
                return true;
        }

        return false;
    }
};