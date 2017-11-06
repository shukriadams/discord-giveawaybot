// queue startTime(xd xh or xm) duration(xd xh or xm) steamlink|steamid (required) optional key : queues a competition for future
let argParser = require('minimist-string'),
    getTime = require('./../utils/getTime'),
    createGiveaway = require('./../utils/createGiveaway'),
    messages = require('./../utils/messages'),
    codes = require('./../utils/codes'),
    hi = require('./../utils/highlight'),
    steamUrl = require('./../utils/steamUrl');

module.exports = async function (client, message, messageText){
    let args = argParser(messageText);

    // merge args
    if (args.s) args.start = args.s;
    if (args.d) args.duration = args.d;
    if (args.i) args.id = args.i;
    if (args.k) args.key = args.k;
    if (args.h) args.help = true;

    // validate input
    if (args.help || !args.start || !args.duration || !args.id){
        message.author.send(`Expected : ${hi('queue  -s startTime -d durationTime -i Steamlink/id -k gamekey')}. Key is optional. ${message.timeFormat}`);
        return codes.MESSAGE_REJECTED_INVALIDARGUMENTS;
    }

    // second and third arg must be time
    let start = getTime(args.start),
        duration = getTime(args.duration);

    if(!start){
        message.author.send(`Start time ${hi(args.start)} is invalid. ${messages.timeFormat}`);
        return codes.MESSAGE_REJECTED_INVALIDTIMEFORMAT;
    }

    if (!duration){
        message.author.send(`Duration time ${hi(args.duration)} is invalid. ${messages.timeFormat}`);
        return codes.MESSAGE_REJECTED_INVALIDTIMEFORMAT;
    }

    let steamUrlInfo = steamUrl.getInfo(args.id.toLowerCase());

    // message, start, duration, steamUrlInfo, code
    let result = await createGiveaway(message, client, start, duration, steamUrlInfo, args.key);
    return result;

};
