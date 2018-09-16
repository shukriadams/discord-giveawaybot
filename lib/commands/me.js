// list : list everything
let timeHelper = require('../timeHelper'),
    bracketHelper = require('../bracketHelper'),
    permissionHelper = require('../permissionHelper'),
    codes = require('../codes'),
    Store = require('../store'),
    Settings = require('../settings');

module.exports = async function (message){

    let settings = Settings.instance(),
        store = await Store.instance(),
        winnings = store.getWinnings(message.author.id),
        isAdmin = await permissionHelper.isAdmin(message.client, message.author),
        hasGiveawayRole = await permissionHelper.hasRole(message.client, settings.values.giveawayRole),
        reply = '';

    if (winnings.length ){
        reply += 'You recently won the following game(s):\n';
        for (let winning of winnings){
            let daysSince = timeHelper.daysSince(winning.ended),
                coolDown = settings.values.winningCooldownDays - daysSince;

            reply += `${winning.gameName} ${daysSince} days ago. `;

            let bracket = bracketHelper.fromString(winning.bracket);
            if (bracket && coolDown >= 0){
                reply += `You'll need to wait ${coolDown} days to try again for a game in the range ${bracket.min}-${bracket.max} ${settings.values.bracketsCurrencyZone}.`;
            }

            reply += '\n'
        }
    } else {
        reply = `You haven't won anything in the last ${settings.values.winningCooldownDays} days\n`
    }

    if (isAdmin){
        reply += 'You have admin permissions.'
    }

    if (hasGiveawayRole){
        reply += 'You can create giveaways'
    }

    reply += '\nYou have the following roles:\n';
    reply += await permissionHelper.getRoles(message.client, message.author);

    await message.author.send(reply);
    return codes.MESSAGE_ACCEPTED;

};
