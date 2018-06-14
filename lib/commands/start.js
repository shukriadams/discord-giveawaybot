let argsHelper = require('../argsHelper'),
    getTime = require('../getTime'),
    createGiveaway = require('../createGiveaway'),
    messages = require('../messages'),
    GameInfo = require('../gameInfo'),
    hi = require('../highlight'),
    codes = require('../codes');

module.exports = async function (message, messageText){

    // first check if start command is running in simple mode
    let args = argsHelper.stringSplit(messageText),
        gameInfoHelper = GameInfo.instance(),
        hasSwitches = args.some(function(arg) { return arg.indexOf('-') === 0; });

    async function showHelp(){
        await message.author.send(
            `${hi('start')} begins a giveaway immediately. The giveaway runs for an amount of time, after which a random entrant is picked as the winner. \n\n` +
            `Simple : ${hi('start time SteamUrl')}. This easy method doesn't use switches, but works only on standard Steam games. \n`+
            `Example: ${hi('start 5h htt://store.steampowered.com/app/593280/Cat_Quest/')} creates a giveaway for Cat Quest that runs for 5 hours.\n\n`+
            `Advanced : You can also giveaway titles that are not standard Steam games (bundles, non-Steam games, special editions etc) with :  ${hi('start -d time -u url -p price')}.\n`+
            `Example: ${hi('start -d 5h -u http://store.steampowered.com/app/593280')} creates a giveaway for Cat Quest that runs for 5 hours.\n`+
            `When entering prices for a game, user the full price, not current special or discount prices.\n` +
            `${messages.timeFormat}.`);
        return codes.MESSAGE_REJECTED_INVALIDARGUMENTS;
    }

    async function showDurationError(){
        await message.author.send(`Duration time ${hi(args[1])} is invalid. ${messages.timeFormat}`);
        return codes.MESSAGE_REJECTED_INVALIDTIMEFORMAT;
    }

    if (hasSwitches){

        args = argsHelper.toArgsObject(messageText);

        // merge args
        if (args.d) args.duration = args.d;
        if (args.h) args.help = true;
        if (args.u) args.url = args.u;
        if (args.p) args.price = args.p;

        if (args.help)
            return await showHelp();

        // second and third arg must be time
        let duration = getTime(args.duration);
        if(!duration)
            return await showDurationError();

        let gameInfo = await gameInfoHelper.getInfo({
            price : args.price,
            url : args.url
        });

        let result = await createGiveaway(message, message.client, null, duration, null, gameInfo);
        return result;
    }

    // 3 args is the special "shorthand" start that takes a duration and url only, and the url has to be a valid steam app
    if (args.length === 3){
        let duration = getTime(args[1]);

        if(!duration)
            return await showDurationError();

        let gameInfo = await gameInfoHelper.getInfo({
            url : args[2]
        });

        let result = await createGiveaway(message, message.client, null, duration, null, gameInfo);
        return result;
    }

    return await showHelp();
};
