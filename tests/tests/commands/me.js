let assert = require('./../../helpers/assert'),
    codes = require('./../../../lib/codes'),
    Store = require('./../../../lib/store'),
    makeMessage = require('./../../helpers/message'),
    test = require('./../../helpers/testBase');


test('me command', function(testBase){

    it('should accept a me command', async function() {
        let store = await Store.instance();
        // force a give away to ensure we enter the per-giveaway loop and cover as much as code as possible
        store.setRecords([{
            ended : new Date().getTime()
        }]);

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'me';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_ACCEPTED, result);
    });

});