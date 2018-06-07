let assert = require('./../../helpers/assert'),
    codes = require('./../../../lib/codes'),
    makeMessage = require('./../../helpers/message'),
    test = require('./../../helpers/testBase');

test('help command', function(testBase){

    it('should accept a help command', async function() {

        // mimic structure of a valid discord, with invalid command
        let message = await makeMessage(testBase.client.user.id);
        message.content = 'help';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_ACCEPTED, result);
    });

});