let _isTest = false,
    Settings = require('./settings'),
    timeHelper = require('./timeHelper'),
    _instance = null,
    _instanceDate = null,
    Discord = require('discord.js');

module.exports = {

    /**
     * Returns a client instance ready for communication with Discord.
     */
    instance : async function(){
        return new Promise(function(resolve, reject){
            try {
                if (_isTest && _instance)
                    return resolve(_instance);
                let settings = Settings.instance();

                if (!_instance || (settings.values.processLifetime && timeHelper.minutesSince(_instanceDate) > settings.values.processLifetime)) {

                    _instance = new Discord.Client();
                    _instanceDate= new Date();
                    _instance.login(settings.values.token);
                    _instance.on('ready', function(){
                        return resolve(_instance);
                    });
                } else {
                    resolve(_instance);
                }
            } catch(ex){
                reject (ex);
            }
        })
    },

    /**
     * Force an instance for testing
     */
    set : function(testingInstance){
        _instance = testingInstance;
        _isTest = true;
    }
};