let State = require('./../utils/state'),
    permissionHelper = require('./../utils/permissionHelper'),
    messages = require('./../utils/messages'),
    argParser = require('minimist-string'),
    hi = require('./../utils/highlight'),
    codes = require('./../utils/codes');

module.exports = async function (client, message, messageText){

    let state = State.instance(),
        args = argParser(messageText),
        isAdmin = await permissionHelper.isAdmin(client, message.author);

    if (!isAdmin){
        message.author.send(messages.permissionError);
        return codes.MESSAGE_REJECTED_PERMISSION;
    }

    if (args.h) args.help = true;
    if (args.c) args.clear = true;

    if (args.help) {
        message.reply(
            `${hi('status')} lets you know if anything is seriously wrong with the bot. The bot will warn in replies or in posts to the giveaway channel that its in trouble.\n\n` +
            `You can clear current status warnings with : ${hi('status --clear')}. The warnings will reappear if the issues recur.`);

        return codes.MESSAGE_ACCEPTED_HELPRETURNED;
    }

    if (args.clear){
        state.clear();
        message.author.send('Status cleared');
        return codes.MESSAGE_ACCEPTED_STATUSCLEARED;
    }

    let reply = '',
        items = state.get();

    if (items.length){

        for (let item in items)
            reply += `${items[item]}\n`;

        reply += `\n\n You can dismiss these warnings with ${hi('status --clear')}`;

    } else {
        reply = 'Nothing to report!';
    }

    message.author.send(reply);
    return codes.MESSAGE_ACCEPTED;

};