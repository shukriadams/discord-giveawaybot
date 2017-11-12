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
        message.author.send(
        `${hi('Queue')} creates a giveaway, but lets you specify a time in the future when the giveaway will publicly commence.\n\n` +
        `Expected : ${hi('queue -s startTime -d durationTime -i SteamUrl/id -k key')}. Key is the code for activating the game, and is optional. The winner will automatically be messaged this key when the giveaway ends. \n` +
        `Example : ${hi('queue -s 5m -d 1h -i 524220 -k 12345-abcde-12346')} queues a giveaway that starts in 5 minutes, runs for 1 hour, gives away Nier Automata, and messages the key 12345-abcde-12346 to the winner.\n` +
        `Use EITHER minutes, hours or days. If you want 2 days you can either enter 48h or 2d, and if you want 5,5 hours, you enter 330m.` +
        `${messages.timeFormat}`);
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

    let steamUrlInfo = steamUrl.getInfo(args.id);

    // message, start, duration, steamUrlInfo, code
    let result = await createGiveaway(message, client, start, duration, steamUrlInfo, args.key);
    return result;

};
