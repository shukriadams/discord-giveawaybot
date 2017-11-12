/**
 * Wraps the settings.json file so we have a single point of read/write
 */
let fs = require('fs'),
    path = require('path'),
    jsonfile = require('jsonfile'),
    instance;

class Settings {

    constructor(){
        this.failed = false;
        let settingsPath = path.join( __dirname, '../', 'settings.json');
        if (fs.existsSync(settingsPath)){
            this.values = jsonfile.readFileSync(settingsPath);

            // assign default settings
            // nr of days after which old giveaways are automatically deleted
            if (this.values.deleteGiveawaysAfter === undefined)
                this.values.deleteGiveawaysAfter = 14;

            if (this.values.winningCooldownDays === undefined)
                this.values.winningCooldownDays = 3;

            if (this.values.maxConcurrentGiveaways === undefined)
                this.values.maxConcurrentGiveaways = 5;

            if (this.values.joinGiveawayResponseCharacter === undefined)
                this.values.joinGiveawayResponseCharacter = '🎉';
        }
    }

    save(){
        if (this.values)
            jsonfile.writeFileSync('./settings.json', this.values);
    }

}

module.exports = {
    instance : function(){
        if (!instance)
            instance = new Settings();

        return instance;
    },
    set : function (newInstance){
        instance = newInstance;
    }
};
