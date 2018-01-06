let winston = require('winston'),
    fs = require('fs'),
    _instance,
    process = require('process'),
    path = require('path');


class Logger {
    constructor(){

        let logFolder = path.join(process.cwd(), 'discord-giveawaybot', '__logs');

        if (!fs.existsSync(logFolder))
            fs.mkdirSync(logFolder);

        // apply rotation override for winston
        require('winston-daily-rotate-file');

        this.info = new (winston.Logger)({
            transports: [
                new (winston.transports.DailyRotateFile)({
                    filename: path.join(logFolder, '.log'),
                    datePattern: 'info.yyyy-MM-dd',
                    prepend: true,
                    level: 'info'
                })
            ]
        });

        this.error = new (winston.Logger)({
            transports: [
                new (winston.transports.DailyRotateFile)({
                    filename: path.join(logFolder, '.log'),
                    datePattern: 'error.yyyy-MM-dd',
                    prepend: true,
                    level: 'error'
                })]
        });

    }
}

module.exports = {
    instance : function(){
        if (!_instance)
            _instance = new Logger();

        return _instance;
    },
    set : function(newInstance){
        _instance = newInstance;
    }
};
