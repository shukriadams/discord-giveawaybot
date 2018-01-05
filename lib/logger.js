let winston = require('winston'),
    fs = require('fs'),
    process = require('process'),
    path = require('path');

require('winston-daily-rotate-file');

let logFolder = path.join(process.cwd(), '__logs');

if (!fs.existsSync(logFolder))
    fs.mkdirSync(logFolder);

let infoLog = new (winston.Logger)({
    transports: [
        new (winston.transports.DailyRotateFile)({
            filename: path.join(logFolder, '.log'),
            datePattern: 'info.yyyy-MM-dd',
            prepend: true,
            level: 'info'
        })
    ]
});

let errorLog = new (winston.Logger)({
    transports: [
        new (winston.transports.DailyRotateFile)({
            filename: path.join(logFolder, '.log'),
            datePattern: 'error.yyyy-MM-dd',
            prepend: true,
            level: 'error'
        })]
});

module.exports = {
    error : errorLog,
    info : infoLog
};
