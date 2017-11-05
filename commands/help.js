// help : displays help info
let codes = require('./../utils/codes'),
    Settings = require('./../utils/settings'),
    permissionHelper = require('./../utils/permissionHelper'),
    hi = require('./../utils/highlight');

module.exports = async function (client, message){

    let settings = Settings.instance(),
        isAdmin = await permissionHelper.isAdmin(client, message.author),
        isAdminOrCanGiveaway = await permissionHelper.isAdminOrHasRole(client, message.author, settings.values.giveawayRole),
        text = [];

    // all users
    text.push({ seq : 'h', text : `${hi('help')} : displays this text.`  });
    text.push({ seq : 'l', text : `${hi('list')} or ${hi('list all')} : lists giveaways.`});
    text.push({ seq : 'm', text : `${hi('me')} : Tells you if you're on cooldown.`});
    text.push({ seq : '', text : `Hi, I'm giveaway bot. I give things away on your behalf. My commands are :`});
    text.push({ seq : 'zzz', text : `All commands except ${hi('channel')} should be sent to me in direct chat.` });
    text.push({ seq : 'b', text : `${hi('brackets [price]-[price]..')} : sets price brackets for games.` });

    // admin / giveaway creator users
    if (isAdminOrCanGiveaway){
        text.push({ seq : 'c', text : `${hi('cancel [giveaway id]')} : Cancels a giveaway.`});
        text.push({ seq : 'q', text : `${hi('queue [start time] [duration time] [Steam link/id] [game activation key]')} : queues a giveaway to start in the future. Start time is when it starts from now, duration how long it runs for. Activation key is optional.`});
        text.push({ seq : 'r', text : `${hi('reroll [giveaway id]')} : rerolls a winner on a finished giveaway.`});
        text.push({ seq : 'star', text : `${hi('start [duration time] [Steam link/id]')} : starts a giveaway immediately.`});
    }

    //admins only
    if (isAdmin){
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

    message.author.send(output);
    return codes.MESSAGE_ACCEPTED;

};