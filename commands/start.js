// start : duration(xd xh or xm) steamlink|steamid (required) : starts a competition immediately
let argParser = require('minimist-string'),
    getTime = require('./../utils/getTime'),
    createGiveaway = require('./../utils/createGiveaway'),
    messages = require('./../utils/messages'),
    hi = require('./../utils/highlight'),
    codes = require('./../utils/codes'),
    steamUrl = require('./../utils/steamUrl');

module.exports = async function (client, message, messageText){
    let args = argParser(messageText);

    // merge args
    if (args.d) args.duration = args.d;
    if (args.i) args.id = args.i;
    if (args.h) args.help = true;

    // validate input
    if (args.help || !args.duration || !args.id){
        message.author.send(`Expected : ${hi('start -d time -i Steamlink/id')}. ${messages.timeFormat}.`);
        return codes.MESSAGE_REJECTED_INVALIDARGUMENTS;
    }

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
};
