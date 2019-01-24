/**
 * Wraps the settings.json file so we have a single point of read/write
 */
let fs = require('fs'),
    path = require('path'),
    process = require('process'),
    jsonfile = require('jsonfile'),
    _instance;

class Settings {

    constructor(){
        this.failed = false;
        this.settingsFilePath = path.join(process.cwd(), 'discord-giveawaybot', 'settings.json');

        if (!fs.existsSync(this.settingsFilePath))
            throw new Error('\'settings.json\' not found in bot working folder.');

        try {
            this.values = jsonfile.readFileSync(this.settingsFilePath);
        } catch (ex){
            throw new Error(`'Failed to read settings.json : ${ex}`);
        }

        // assign default settings
        // nr of days after which old giveaways are automatically deleted
        if (this.values.deleteGiveawaysAfter === undefined)
            this.values.deleteGiveawaysAfter = 14;

        if (this.values.winningCooldownDays === undefined)
            this.values.winningCooldownDays = 3;

        if (this.values.maxConcurrentGiveaways === undefined)
            this.values.maxConcurrentGiveaways = 5;

        if (this.values.daemonInterval === undefined)
            this.values.daemonInterval = '*/10 * * * * *';

        if (this.values.processLifetime === undefined)
            this.values.processLifetime = 10; // 10 minutes

        if (this.values.joinGiveawayResponseCharacter === undefined)
            this.values.joinGiveawayResponseCharacter = '🎉';

        if (this.values.enableHealthMonitor === undefined)
            this.values.enableHealthMonitor = false;

        if (this.values.healthMonitorPort === undefined)
            this.values.healthMonitorPort = 8080;


        // int, and in minutes
        if (this.values.processLifetime && !Number.isInteger(this.values.processLifetime))
            throw new Error ('settings.json processLifetime value must an integer');
    }

    save(){
        if (this.values)
            jsonfile.writeFileSync(this.settingsFilePath, this.values);
    }

}

module.exports = {
    instance : function(){
        if (!_instance)
            _instance = new Settings();

        return _instance;
    },
    set : function (newInstance){
        _instance = newInstance;
    }
};
