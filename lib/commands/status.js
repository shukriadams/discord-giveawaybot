let State = require('../state'),
    argsHelper = require('../argsHelper'),
    permissionHelper = require('../permissionHelper'),
    messages = require('../messages'),
    recordFetch = require('../recordFetch'),
    Settings = require('../settings'),
    hi = require('../highlight'),
    codes = require('../codes');

module.exports = async function (message, messageText){

    let state = State.instance(),
        settings = Settings.instance(),
        args = argsHelper.toArgsObject(messageText),
        isAdmin = await permissionHelper.isAdmin(message.client, message.author);

    if (!isAdmin){
        await message.author.send(messages.permissionError);
        return codes.MESSAGE_REJECTED_PERMISSION;
    }

    if (args.h) args.help = true;
    if (args.c) args.clear = true;

    if (args.help) {
        await message.reply(
            `${hi('status')} lets you know if anything is seriously wrong with the bot. The bot will warn in replies or in posts to the giveaway channel that its in trouble.\n\n` +
            `You can clear current status warnings with : ${hi('status --clear')}. The warnings will reappear if the issues recur.`);

        return codes.MESSAGE_ACCEPTED_HELPRETURNED;
    }

    if (args.clear){
        state.clear();
        await message.author.send('Status cleared');
        return codes.MESSAGE_ACCEPTED_STATUSCLEARED;
    }

    let guild = await recordFetch.fetchGuildById(message.client, settings.values.guildId);
    if (!guild){
        await message.author.send(`Failed to retrieve guild ${settings.values.guildId}`);
        return codes.MESSAGE_REJECTED_GUILDNOTRESOLVABLE;
    }

    let reply = `Guild : ${guild.name} \n\n`,
        items = state.get();

    if (items.length){

        for (let item in items)
            reply += `${items[item]}\n`;

        reply += `\n\n You can dismiss these warnings with ${hi('status --clear')}`;

    } else {
        reply += 'Nothing to report!';
    }

    await message.author.send(reply);
    return codes.MESSAGE_ACCEPTED;

};