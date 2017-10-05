// help : displays help info
let codes = require('./../utils/codes'),
    hi = require('./../utils/highlight');

module.exports = async function (client, message){

    let text =
        `Hi, I\'m giveaway bot. I give things away on your behalf. My commands are : \n` +
        `${hi('brackets [price]-[price]..')} : sets price brackets for games. \n` +
        `${hi('cancel [giveaway id]')} : Cancels a giveaway. \n` +
        `${hi('channel')} : sets a channel as the one giveaways will happen in - *Note : this command must be typed in the channel you want to set*. \n` +
        `${hi('help')} : displays this text. \n` +
        `${hi('list')} or ${hi('list all')} : lists giveaways. \n` +
        `${hi('me')} : Tells you if you're on cooldown. \n` +
        `${hi('queue [start time] [duration time] [Steam link/id] [game activation key]')} : queues a giveaway to start in the future. Start time is when it starts from now, duration how long it runs for. Activation key is optional. \n` +
        `${hi('reroll [giveaway id]')} : rerolls a winner on a finished giveaway. \n` +
        `${hi('start [duration time] [Steam link/id]')} : starts a giveaway immediately. \n` +
        `${hi('status')} : gets bot status. \n` +
        `\n` +
        `All commands except ${hi('channel')} should be sent to me in direct chat.\n`;

    message.author.send(text);
    return codes.MESSAGE_ACCEPTED;

};