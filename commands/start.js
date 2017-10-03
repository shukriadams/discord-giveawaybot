// start : duration(xd xh or xm) steamlink|steamid (required) : starts a competition immediately
let getTime = require('./../utils/getTime'),
    createGiveaway = require('./../utils/createGiveaway'),
    messages = require('./../utils/messages'),
    hi = require('./../utils/highlight'),
    codes = require('./../utils/codes'),
    steamUrl = require('./../utils/steamUrl');

module.exports = async function (client, message, messageText){
    return new Promise(async function(resolve, reject){
        try {
            let args = messageText.split(' ');

            // validate input
            if (args.length !== 3){
                message.author.send(`Invalid start command. Expected : ${hi('start [duration time] [Steam link/id]')}. ${messages.timeFormat}.`);

                return resolve(codes.MESSAGE_REJECTED_INVALIDARGUMENTS);
            }

            // second and third arg must be time
            let duration = getTime(args[1]);
            if(!duration){
                message.author.send(`Duration time ${hi(args[1])} is invalid. ${messages.timeFormat}`);
                return resolve(codes.MESSAGE_REJECTED_INVALIDTIMEFORMAT);
            }

            let steamUrlInfo = steamUrl.getInfo(args[2].toLowerCase());

            // message, start, duration, steamUrlInfo, code
            let result = await createGiveaway(message, client, null, duration, steamUrlInfo, null);
            resolve(result);

        } catch (ex){
            reject(ex);
        }

    });
};
