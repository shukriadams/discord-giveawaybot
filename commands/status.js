let State = require('./../utils/state'),
    permissionHelper = require('./../utils/permissionHelper'),
    messages = require('./../utils/messages'),
    codes = require('./../utils/codes');

module.exports = async function (client, message){

    let state = State.instance(),
        isAdmin = await permissionHelper.isAdmin(client, message.author);

    if (!isAdmin){
        message.author.send(messages.permissionError);
        return codes.MESSAGE_REJECTED_PERMISSION;
    }

    let reply = '',
        items = state.get();

    if (items.length){
        for (let item in items){
            reply += `${item}\n`;
        }
    } else {
        reply = 'Nothing to report!'
    }

    message.author.send(reply);
    return codes.MESSAGE_ACCEPTED;

};