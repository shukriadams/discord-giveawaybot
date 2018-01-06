// list : list everything
let timeHelper = require('../timeHelper'),
    bracketHelper = require('../bracketHelper'),
    codes = require('../codes'),
    Store = require('../store'),
    Settings = require('../settings');

module.exports = async function (client, message){

    let settings = Settings.instance(),
        store = await Store.instance(),
        winnings = store.getWinnings(message.author.id),
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
        reply = `You haven't won anything in the last ${settings.values.winningCooldownDays} days`
    }

    await message.author.send(reply);
    return codes.MESSAGE_ACCEPTED;

};
