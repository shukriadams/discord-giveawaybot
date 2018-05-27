// help : displays help info
let codes = require('../codes'),
    Settings = require('../settings'),
    permissionHelper = require('../permissionHelper'),
    hi = require('../highlight');

module.exports = async function (message){

    let settings = Settings.instance(),
        isAdmin = await permissionHelper.isAdmin(message.client, message.author),
        isAdminOrCanGiveaway = await permissionHelper.isAdminOrHasRole(message.client, message.author, settings.values.giveawayRole),
        text = [];

    // all users
    text.push({ seq : 'h', text : `${hi('help')} : displays this text.`  });
    text.push({ seq : 'l', text : `${hi('list')} : lists giveaways.`});
    text.push({ seq : 'r', text : `${hi('rules')} : shows rules.`});
    text.push({ seq : 'm', text : `${hi('me')} : Tells you if you're on cooldown.`});
    text.push({ seq : '', text : `Hi, I'm giveaway bot. I give things away on your behalf. My commands are :`});
    text.push({ seq : 'zzz', text : `Command --help or -h gets you detailed instructions, egs ${hi('list --help')}. All commands should be sent to me in direct chat (PM).` });
    text.push({ seq : 'b', text : `${hi('brackets')} : price brackets for games.` });

    // admin / giveaway creator users
    if (isAdminOrCanGiveaway){
        text.push({ seq : 'c', text : `${hi('cancel')} : Cancels a giveaway.`});
        text.push({ seq : 'r', text : `${hi('reroll')} : rerolls a winner on a finished giveaway.`});
        text.push({ seq : 'start', text : `${hi('start')} : starts a giveaway immediately.`});
    }

    //admins only
    if (isAdmin){
        // my wife forced me to hide this here :( Please forgive me, I had no choice.
        text.push({ seq : 'q', text : `${hi('queue')} : queues a giveaway to start in the future. Start time is when it starts from now, duration how long it runs for. Activation key is optional.`});
        text.push({ seq : 'stat', text : `${hi('status')} : gets bot status.`});
        text.push({ seq : 'c', text : `${hi('channel')} : sets a channel as the one giveaways will happen in - *Note : this command must be typed in the channel you want to set*.`});
    }

    // order alphabetically by 'seq' property
    text.sort(function(a, b) {
        return a.seq > b.seq ? 1 :
            a.seq < b.seq ? -1 :
                0;
    });

    let output = '';
    for (let item of text)
        output += item.text + '\n';

    await message.author.send(output);
    return codes.MESSAGE_ACCEPTED;

};