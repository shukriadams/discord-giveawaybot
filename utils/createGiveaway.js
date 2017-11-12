/**
 * Common logic for start and queue commands. Creates a giveaway.
 */
let Settings = require('./settings'),
    permissionHelper = require('./permissionHelper'),
    bracketHelper = require('./bracketHelper'),
    SteamInfo = require('./steamInfo'),
    codes = require('./codes'),
    infoLog = require('./logger').info,
    Store = require('./store');

module.exports = async function create(message, client, start, duration, steamUrlInfo, code){
    let settings = Settings.instance();
    let steamInfo = SteamInfo.instance();
    let store = await Store.instance();

    // user needs to be admin or have giveaway permission
    let hasPermission = await permissionHelper.isAdminOrHasRole(client, message.author, settings.values.giveawayRole);
    if (!hasPermission){
        message.author.send('You don\'t  have permission to create a giveaway');
        return codes.MESSAGE_REJECTED_PERMISSION;
    }

    let gameInfo = await steamInfo.get(steamUrlInfo.steamId, steamUrlInfo.steamUrl);
    if (!gameInfo.success){
        message.author.send(`Error : ${steamUrlInfo.steamId} is not a valid steam game id. \n` +
            'You can get the id from the game\'s store page on Steam. For example, store.steampowered.com/app/379720/DOOM/ is the URL for Doom, and the id is 379720');
        return codes.MESSAGE_REJECTED_INVALIDSTEAMID;
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
        steamId : steamUrlInfo.steamId,
        channelId : message.channel.id,
        steamName: gameInfo.steamName,
        price : gameInfo.price,
        bracket : bracket ? bracketHelper.toString(bracket): null
    };

    let queued = store.add(giveaway),
        verb = start? 'Queued' : 'Starting';

    message.author.send(`${verb} giveaway id ${queued.id}, ${gameInfo.steamName}`);
    infoLog.info(`${message.author.username} created giveaway | id: ${queued.id} | verb: ${verb} | title: ${gameInfo.steamName} | start: ${(start?start.minutes:null)}| duration: ${(duration ? duration.minutes: null)}| steamUrlId: ${steamUrlInfo.steamId}| code: ${code} `);
    return codes.MESSAGE_ACCEPTED;

};
