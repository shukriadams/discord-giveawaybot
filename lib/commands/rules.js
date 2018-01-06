// help : displays help info
let argParser = require('minimist-string'),
    codes = require('../codes'),
    Settings = require('../settings'),
    permissionHelper = require('../permissionHelper'),
    messages = require('../messages'),
    hi = require('../highlight');

module.exports = async function (client, message, messageText){

    let settings = Settings.instance(),
        isAdmin = await permissionHelper.isAdmin(client, message.author);

    let args = argParser(messageText);

    if (args.h) args.help = true;

    if (args.help) {
        let help = `${hi('rules')} displays a simple rules message.\n\n`;
        if (isAdmin)
            help += `${hi('rules --text "your rules text"')} sets the rules text.`;
        message.author.send(help);
        return codes.MESSAGE_ACCEPTED;
    }

    if (args.text){
        if (!isAdmin){
            message.author.send(messages.permissionError);
            return codes.MESSAGE_REJECTED_PERMISSION;
        }

        settings.values.ruleText = args.text;
        settings.save();
        message.author.send(`Rule text updated to : \n\n ${settings.values.ruleText}`);
        return codes.MESSAGE_ACCEPTED;
    }

    // display rules
    let text = settings.values.ruleText;
    if (!text)
        text = 'Rule text is not set. You might want to tell an admin about that.';
    message.author.send(text);

    return codes.MESSAGE_ACCEPTED;

};