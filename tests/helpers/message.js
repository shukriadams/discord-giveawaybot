/**
 * Returns structure of a valid message
 */
let Collection = require('./../helpers/collection'),
    ClientProvider = require('./../../lib/clientProvider');

module.exports = async function(botId){
    let client = await ClientProvider.instance();

    return {
        author : {
            bot : false,

            // another shim function
            send : function(){}
        },
        client: client,
        content : '',
        channel : {
            type : 'dm'
        },
        mentions : {
            users : new Collection([
                { id : botId }
            ])
        },

        // shim function, discord messages can be replied to, but for testing we don't care about what happens inside this
        reply : function(){

        }
    }
};