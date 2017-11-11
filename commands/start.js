// start : duration(xd xh or xm) steamlink|steamid (required) : starts a competition immediately
let argParser = require('minimist-string'),
    getTime = require('./../utils/getTime'),
    createGiveaway = require('./../utils/createGiveaway'),
    messages = require('./../utils/messages'),
    hi = require('./../utils/highlight'),
    codes = require('./../utils/codes'),
    steamUrl = require('./../utils/steamUrl');

module.exports = async function (client, message, messageText){

    // first check if start command is running in simple mode
    let args = messageText.split(' '),
        hasSwitches = args.some(function(arg) { return arg.indexOf('-') === 0; });

    function showHelp(){
        message.author.send(
            `${hi('start')} begins a giveaway immediately. The giveaway runs for an amount of time, after which a random entrant is picked as the winner. \n\n` +
            `Simple mode: ${hi('start -d time -i Steamlink/id')} \n`+
            `Example: ${hi('start 5h 593280')} creates a giveaway for Cat Quest that runs for 5 hours.\n\n`+
            `Advanced mode: ${hi('start -d time -i Steamlink/id')}.\n\n`+
            `Example: ${hi('start -d 5h -i 593280')} creates a giveaway for Cat Quest that runs for 5 hours.\n`+
            `${messages.timeFormat}.`);
        return codes.MESSAGE_REJECTED_INVALIDARGUMENTS;
    }

    if (hasSwitches){
        args = argParser(messageText);
        // merge args
        if (args.d) args.duration = args.d;
        if (args.i) args.id = args.i;
        if (args.h) args.help = true;

        // validate input
        if (args.help || !args.duration || !args.id)
            return showHelp();

        // second and third arg must be time
        let duration = getTime(args.duration);
        if(!duration){
            message.author.send(`Duration time ${hi(args.duration)} is invalid. ${messages.timeFormat}`);
            return codes.MESSAGE_REJECTED_INVALIDTIMEFORMAT;
        }

        let steamUrlInfo = steamUrl.getInfo(args.id.toLowerCase());

        // message, start, duration, steamUrlInfo, code
        let result = await createGiveaway(message, client, null, duration, steamUrlInfo, null);
        return result;
    }

    if (args.length === 3){
        let duration = getTime(args[1]);
        if(!duration){
            message.author.send(`Duration time ${hi(args[1])} is invalid. ${messages.timeFormat}`);
            return codes.MESSAGE_REJECTED_INVALIDTIMEFORMAT;
        }

        let steamUrlInfo = steamUrl.getInfo(args[2].toLowerCase());

        // message, start, duration, steamUrlInfo, code
        let result = await createGiveaway(message, client, null, duration, steamUrlInfo, null);
        return result;
    }

    return showHelp();
};
