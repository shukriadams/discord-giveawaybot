/**
 * Common logic for start and queue commands. Creates a giveaway.
 */
let Settings = require('./settings'),
    permissionHelper = require('./permissionHelper'),
    bracketHelper = require('./bracketHelper'),
    hi = require('./highlight'),
    codes = require('./codes'),
    Logger = require('./logger'),
    Store = require('./store');

module.exports = async function create(message, client, start, duration, code, gameInfo){
    let settings = Settings.instance(),
        store = await Store.instance(),
        infoLog = Logger.instance().info;

    // user needs to be admin or have giveaway permission
    let hasPermission = await permissionHelper.isAdminOrHasRole(client, message.author, settings.values.giveawayRole);
    if (!hasPermission){
        message.author.send('You don\'t  have permission to create a giveaway');
        return codes.MESSAGE_REJECTED_PERMISSION;
    }

    if (!gameInfo.url){
        message.author.send(`Error : Game url is required. Use the ${hi('--url')} or ${hi('-u')} switch.`);
        return codes.MESSAGE_REJECTED_INVALIDGAMEURL;
    }

    if (gameInfo.urlError){
        message.author.send(`Error : '${gameInfo.url}' is not a valid url.`);
        return codes.MESSAGE_REJECTED_INVALIDGAMEURL;
    }

    if (!gameInfo.price){
        message.author.send(`Error : Game price could not be read from the link you provided, you will need to provide the game's price with ${hi('--price')} or ${hi('-p')}. ` +
        `Price should be digits only, egs ${hi('--price 10 ')} or ${hi('--p 299')}.`);
        return codes.MESSAGE_REJECTED_NOPRICE;
    }

    let activeGiveaways = store.getActive();
    if (activeGiveaways.length >= settings.values.maxConcurrentGiveaways){

        // calc end time of giveaways
        let nextGiveawayToEnd = store.getNextGiveawayToEnd();

        message.author.send(`Error : The maximum number of concurrent giveaways (${settings.values.maxConcurrentGiveaways}) has been reached. The next giveaway to end is ${nextGiveawayToEnd.giveaway.gameName} in ${nextGiveawayToEnd.endsIn}.`);
        return codes.MESSAGE_REJECTED_MAXCONCURRENTGIVEAWAYS;
    }

    // try to get bracket - this can be null if no brackets exist
    let bracket = bracketHelper.findBracketForPrice(gameInfo.price);

    let giveaway = {
        status : 'pending',
        ownerId : message.author.id,
        duration : duration.time,
        durationMinutes : duration.minutes,
        start :  start ? start.time : null,
        startMinutes :  start ? start.minutes : null,
        participants : [],
        rejectedWinners : [],
        cooldownUsers: [],
        code : code ? code : null,
        created : new Date().getTime(),
        lastUpdated : new Date().getTime(),
        channelId : message.channel.id,
        gameUrl: gameInfo.url,
        gameName: gameInfo.gameName,
        price : gameInfo.price,
        bracket : bracket ? bracketHelper.toString(bracket): null
    };

    let queued = store.add(giveaway),
        verb = start? 'Queued' : 'Starting';

    message.author.send(`${verb} giveaway id ${queued.id}, ${gameInfo.gameName}`);
    infoLog.info(`${message.author.username} created giveaway | id: ${queued.id} | verb: ${verb} | title: ${gameInfo.gameName} | start: ${(start?start.minutes:null)}| duration: ${(duration ? duration.minutes: null)}| code: ${code} `);
    return codes.MESSAGE_ACCEPTED;

};
