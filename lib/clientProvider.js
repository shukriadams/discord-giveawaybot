let _testingInstance,
    Settings = require('./settings'),
    Discord = require('discord.js');

module.exports = {

    /**
     * Returns a client instance ready for communication with Discord.
     */
    instance : async function(){
        return new Promise(function(resolve, reject){
            try {
                if (_testingInstance)
                    return resolve(_testingInstance);

                let settings = Settings.instance(),
                    client = new Discord.Client();

                client.login(settings.values.token);
                client.on('ready', function(){
                    resolve(client);
                });

            } catch(ex){
                reject (ex);
            }
        })
    },

    /**
     * Force an instance for testing
     */
    set : function(testingInstance){
        _testingInstance = testingInstance;
    }
};