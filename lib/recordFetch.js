/**
 * Traps unnecessary exceptions caused when querying non-existent objects
 */
let winston = require('winston');

module.exports = {

    fetchMessage : async function(channel, id){
        try
        {
            return await channel.fetchMessage(id);
        } catch(ex){
            if (ex.code === 10008) // unknown message exception , it's cool bro
                return null;

            // ugh
            throw ex;
        }
    },

    fetchUser : async function(client, id){
        try{
            return await client.fetchUser(id);
        }catch(ex){
            // this exception would occur only if a user account disappears from discord, not sure if this ever happens
            // and cannot test, but for safety, log exception so it doesn't die in silence, and then continue.
            winston.error(ex);
            return null;
        }
    },

    /* tries to find guild from all channels attach to bot */
    fetchGuild : async function(client){
        try {
            let channels = client.channels.array();
            for (let channel of channels) {
                if (channel.guild);
                    return channel.guild;
            }
        }catch(ex){
            winston.error(ex);
            return null;
        }
    },

    fetchGuildById : async function(client, guildId){
        try {
            return await client.guilds.get(guildId);
        } catch(ex) {
            winston.error(ex);
            return null;
        }
    },

    fetchGuildMember : async function(client, user){
        try{
            return await client.channels.array()[0].guild.fetchMember(user)
        }catch(ex){
            // this exception would occur only if a user account disappears from discord, not sure if this ever happens
            // and cannot test, but for safety, log exception so it doesn't die in silence, and then continue.
            winston.error(ex);
            return null;
        }
    }

};
