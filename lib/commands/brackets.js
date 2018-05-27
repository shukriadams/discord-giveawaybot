// brackets : 0-100-300     Number separated by dashes. This example creates two brackets, 0-100 and 100-300. Prices are always USD.

let permissionHelper = require('../permissionHelper'),
    argsHelper = require('../argsHelper'),
    codes = require('../codes'),
    messages = require('../messages'),
    Logger = require('../logger'),
    hi = require('../highlight'),
    Settings = require('../settings');

module.exports = async function (message, messageText){
    let settings = Settings.instance(),
        infoLog = Logger.instance().info,
        hasArgs = argsHelper.stringSplit(messageText).length > 1,
        args = argsHelper.toArgsObject(messageText),
        isAdmin = await permissionHelper.isAdmin(message.client, message.author);

    // merge args
    if (args.h) args.help = true;
    if (args.b) args.brackets = args.b;

    if (args.brackets){
        if (!isAdmin){
            await message.author.send(messages.permissionError);
            return codes.MESSAGE_REJECTED_PERMISSION;
        }

        if (!(typeof args.brackets === 'string')){
            await message.author.send(`-b argument cannot be empty.`);
            return codes.MESSAGE_REJECTED_INVALIDBRACKET;
        }

        let bracketParts = args.brackets.split('-').filter(function(part){ return part.length ? part : null; });
        if (bracketParts.length < 2){
            await message.author.send(`You should specify at least one price range, ex, ${hi('brackets -b 0-100')}.`);
            return codes.MESSAGE_REJECTED_INVALIDBRACKET;
        }

        let brackets = [];
        for (let i = 0 ; i < bracketParts.length ; i ++){
            let bracket = bracketParts[i];

            if (isNaN(bracket)){
                await message.author.send(`${hi(bracket)} is not number.`);
                return codes.MESSAGE_REJECTED_INVALIDBRACKET;
            }

            bracket = parseInt(bracket);
            if (brackets.length > 0)
                brackets[brackets.length - 1].max = bracket;
            if (i !== bracketParts.length - 1)
                brackets.push({min : bracket});
        }

        settings.values.brackets = brackets;
        settings.save();

        await message.author.send(`${hi(brackets.length)} brackets were set.`);
        infoLog.info(`User ${message.author.username} set brackets to ${args.brackets}.`);
        return codes.MESSAGE_ACCEPTED;
    }

    if (args.help){
        if (!isAdmin){
            await message.author.send(messages.permissionError);
            return codes.MESSAGE_REJECTED_PERMISSION;
        }

        await message.author.send(
            `${hi('brackets')} divides games up into price groups.\n\n` +
            `If someone wins a game, they will not be allowed to enter another giveaway for ${settings.values.winningCooldownDays} days. `+
            `Brackets limits this lockout to only the price group they won in, allowing them to continue entering giveaways at other price points.\n\n` +
            `Expected : ${hi('brackets -b price-price..')} \n` +
            `Example ${hi('brackets -b 0-50-100-200')} creates 3 brackets 0-50, 50-100, & 100-200.`);

        return codes.MESSAGE_ACCEPTED_HELPRETURNED;
    }

    // if args supplied by none of the previous cases caught, assume args are invalid
    if (hasArgs){
        await message.author.send(`Invalid command. Try ${hi('brackets -h' )} for help.`);
        return codes.MESSAGE_REJECTED_INVALIDARGUMENTS;
    }

    // fallthrough - return current bracket info
    let reply = '';

    if (!settings.values.brackets || !settings.values.brackets.length){
        reply = 'No brackets set.';
    } else {
        reply += 'The current price brackets are :\n';
        for (let bracket of settings.values.brackets)
            reply += `$${hi(bracket.min)} - $${hi(bracket.max)}\n`;
    }

    if (isAdmin)
        reply += `You can also try ${hi('brackets --help')} for more info.`;

    await message.author.send(reply);
    return codes.MESSAGE_ACCEPTED_BRACKETSLIST;

};