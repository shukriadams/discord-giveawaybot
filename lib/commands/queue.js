let argsHelper = require('../argsHelper'),
    getTime = require('../getTime'),
    createGiveaway = require('../createGiveaway'),
    GameInfo = require('../gameInfo'),
    messages = require('../messages'),
    codes = require('../codes'),
    hi = require('../highlight');

module.exports = async function (message, messageText){

    // first check if start command is running in simple mode
    let args = argsHelper.stringSplit(messageText),
        gameInfoHelper = GameInfo.instance(),
        hasSwitches = args.some(function(arg) { return arg.indexOf('-') === 0; });

    async function showHelp(){
        await message.author.send(
            `${hi('queue')} creates a giveaway, but lets you specify a time in the future when the giveaway will publicly commence.\n\n` +
            `Simple : ${hi('queue startTime durationTime SteamUrl')}. This easy method doesn't use switches, but works only on standard Steam games. \n\n` +
            `More advanced : ${hi('queue -s startTime -d durationTime -u SteamUrl -k key')}. Works only for standard Steam games. Key is the code for activating the game, and is optional. The winner will automatically be messaged this key when the giveaway ends. \n\n` +
            `Very advanced : ${hi('queue -s startTime -d durationTime -u url -p price -k key')}. Works for any game, but you have to manually enter the price. Key is optional. \n\n`+
            `Example : ${hi('queue -s 5m -d 1h -u http://store.steampowered.com/app/524220 -k 12345-abcde-12346')} queues a giveaway that starts in 5 minutes, runs for 1 hour, gives away Nier Automata, and messages the key 12345-abcde-12346 to the winner.\n` +
            `Use EITHER minutes, hours or days. If you want 2 days you can either enter 48h or 2d, and if you want 5,5 hours, you enter 330m.` +
            `${messages.timeFormat}`);
        return codes.MESSAGE_REJECTED_INVALIDARGUMENTS;
    }

    async function showStartError(){
        await message.author.send(`Start time ${hi(args.start)} is invalid. ${messages.timeFormat}`);
        return codes.MESSAGE_REJECTED_INVALIDTIMEFORMAT;
    }

    async function showDurationError(){
        await message.author.send(`Duration time ${hi(args.duration)} is invalid. ${messages.timeFormat}`);
        return codes.MESSAGE_REJECTED_INVALIDTIMEFORMAT;
    }

    if (hasSwitches){

        args = argsHelper.toArgsObject(messageText);

        // merge args
        if (args.s) args.start = args.s;
        if (args.d) args.duration = args.d;
        if (args.k) args.key = args.k;
        if (args.h) args.help = true;
        if (args.u) args.url = args.u;
        if (args.p) args.price = args.p;

        if (args.help)
            return await showHelp();

        // second and third arg must be time
        let start = getTime(args.start),
            duration = getTime(args.duration);

        if(!start)
            return await showStartError();

        if (!duration)
            return await showDurationError();

        let gameInfo = await gameInfoHelper.getInfo({
            price : args.price,
            url : args.url
        });

        let result = await createGiveaway(message, message.client, start, duration, args.key, gameInfo);
        return result;
    }

    // 4 args is the special "shorthand" queue that takes start, duration and url only, and the url has to be a valid steam app
    if (args.length === 4){
        let start = getTime(args[1]),
            duration = getTime(args[2]);

        if(!start)
            return await showStartError();

        if (!duration)
            return await showDurationError();

        let gameInfo = await gameInfoHelper.getInfo({
            url : args[3]
        });

        let result = await createGiveaway(message, message.client, start, duration, null, gameInfo);
        return result;
    }

    return await showHelp();
};
