let recordFetch = require('./recordFetch'),
    Discord = require('discord.js');

module.exports = {

    isAdmin : async function(client, discordUser){
        let guildMember = await recordFetch.fetchGuildMember(client, discordUser);
        if (!guildMember)
            return false;

        return guildMember.hasPermission(Discord.Permissions.FLAGS.MANAGE_CHANNELS);
    },

    canManageMessages : async function(client, discordUser){
        let guildMember = await recordFetch.fetchGuildMember(client, discordUser);
        if (!guildMember)
            return false;

        return guildMember.hasPermission(Discord.Permissions.FLAGS.MANAGE_MESSAGES);
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
    },

    /**/
    hasRole : async function(client, discordUser, roleName){
        let guildMember = await recordFetch.fetchGuildMember(client, discordUser);
        if (!guildMember)
            return false;

        for (let role of guildMember.roles.array()){
            if (role.name === roleName)
                return true;
        }

        return false;
    },

        /**/
    getRoles : async function(client, discordUser){
        let guildMember = await recordFetch.fetchGuildMember(client, discordUser);
        if (!guildMember)
            return 'NO ROLES, NOT A GUILD MEMBER';

        let roles = '';
        for (let role of guildMember.roles.array()){
            roles += `${role.name};`;
        }

        return roles;
    }
};