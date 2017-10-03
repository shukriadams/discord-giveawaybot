let state = require('./../utils/state').instance(),
    codes = require('./../utils/codes');

module.exports = async function (client, message){
    return new Promise(async function(resolve, reject){
        try {

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
            resolve(codes.MESSAGE_ACCEPTED)
        } catch (ex){
            reject(ex);
        }
    });
};