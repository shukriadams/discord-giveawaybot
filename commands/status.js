let state = require('./../utils/state').instance(),
    permissionHelper = require('./../utils/permissionHelper'),
    messages = require('./../utils/messages'),
    codes = require('./../utils/codes');

module.exports = async function (client, message){
    return new Promise(async function(resolve, reject){
        try {

            let isAdmin = await permissionHelper.isAdmin(client, message.author);
            if (!isAdmin){
                message.author.send(messages.permissionError);
                return resolve(codes.MESSAGE_REJECTED_PERMISSION);
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
            resolve(codes.MESSAGE_ACCEPTED);

        } catch (ex){
            reject(ex);
        }
    });
};