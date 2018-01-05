let _instance,
    Discord = require('discord.js');

module.exports = {
    instance : function(){
        if (!_instance)
            _instance = new Discord.Client();

        return _instance;
    },
    set : function(newInstance){
        _instance = newInstance;
    }
};