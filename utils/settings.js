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
