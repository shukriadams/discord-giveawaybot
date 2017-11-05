// help : displays help info
let codes = require('./../utils/codes'),
    Settings = require('./../utils/settings'),
    permissionHelper = require('./../utils/permissionHelper'),
    messages = require('./../utils/messages'),
    hi = require('./../utils/highlight');

module.exports = async function (client, message, messageText){

    let settings = Settings.instance(),
        isAdmin = await permissionHelper.isAdmin(client, message.author),
        text = '';

    let args = messageText.split(' ');
    if (args.length === 1){
        // display rules
        text = settings.values.ruleText;
        if (!text){
            text = 'Rule text is not set. You might want to tell an admin about that.';
        }
        message.author.send(text);
    } else {
        if (!isAdmin){
            message.author.send(messages.permissionError);
            return codes.MESSAGE_REJECTED_PERMISSION;
        }

        settings.values.ruleText = messageText.substr(5).trim();
        settings.save();
        message.author.send(`Rule text updated to : \n\n ${settings.values.ruleText}`);
    }

    return codes.MESSAGE_ACCEPTED;

};