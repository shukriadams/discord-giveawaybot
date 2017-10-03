// queue startTime(xd xh or xm) duration(xd xh or xm) steamlink|steamid (required) optional key : queues a competition for future
let getTime = require('./../utils/getTime'),
    createGiveaway = require('./../utils/createGiveaway'),
    messages = require('./../utils/messages'),
    codes = require('./../utils/codes'),
    hi = require('./../utils/highlight'),
    steamUrl = require('./../utils/steamUrl');

module.exports = async function (client, message, messageText){
    return new Promise(async function(resolve, reject){
        try {
            let args = messageText.split(' ');

            // validate input
            if (args.length !== 4 && args.length !== 5){
                message.author.send(`Invalid queue command. Expected : ${hi('queue [start time] [duration time] [Steam link/id] [gamekey]')}. Key is optional. ${message.timeFormat}`);
                return resolve(codes.MESSAGE_REJECTED_INVALIDARGUMENTS);
            }

            // second and third arg must be time
            let start = getTime(args[1]),
                duration = getTime(args[2]);

            if(!start){
                message.author.send(`Start time ${hi(args[1])} is invalid. ${messages.timeFormat}`);
                return resolve(codes.MESSAGE_REJECTED_INVALIDTIMEFORMAT);
            }

            if (!duration){
                message.author.send(`Duration time ${hi(args[2])} is invalid. ${messages.timeFormat}`);
                return resolve(codes.MESSAGE_REJECTED_INVALIDTIMEFORMAT);
            }

            let steamUrlInfo = steamUrl.getInfo(args[3].toLowerCase());

            let code = null;
            if (args.length === 5){
                code = args[4];
            }

            // message, start, duration, steamUrlInfo, code
            let result = await createGiveaway(message, client, start, duration, steamUrlInfo, code);
            resolve(result);

        } catch (ex){
            reject(ex);
        }

    });
};
