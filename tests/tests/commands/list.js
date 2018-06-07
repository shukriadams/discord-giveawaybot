let assert = require('./../../helpers/assert'),
    codes = require('./../../../lib/codes'),
    Store = require('./../../../lib/store'),
    makeMessage = require('./../../helpers/message'),
    test = require('./../../helpers/testBase');

/**
 * Note : we don't test visibility-by-permission logic because there currently isn't an easy way to pass info about
 * nr. of visible items back to our testing code.
 */

test('list command', function(testBase){

    it('should accept a list command', async function() {
        let store = await Store.instance();
        // force a give away to ensure we enter the per-giveaway loop and cover as much as code as possible
        store.setRecords([{
            created : new Date().getTime(),
            participants : []
        }]);

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'list';

        await testBase.client.raiseMessageEvent(message);
        assert.true(testBase.trace.has(codes.MESSAGE_ACCEPTED));
    });

    it('should accept a list all command', async function() {
        let store = await Store.instance();
        // force a give away to ensure we enter the per-giveaway loop and cover as much as code as possible
        store.setRecords([{
            created : new Date().getTime(),
            participants : []
        }]);

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'list all';

        await testBase.client.raiseMessageEvent(message);
        assert.true(testBase.trace.has(codes.MESSAGE_ACCEPTED));
    });

    it('should accept a list help command', async function() {

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'list -h';

        await testBase.client.raiseMessageEvent(message);
        assert.true(testBase.trace.has(codes.MESSAGE_ACCEPTED_HELPRETURNED));
    });

    it('should accept a list help command', async function() {

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'list --help';

        await testBase.client.raiseMessageEvent(message);
        assert.true(testBase.trace.has(codes.MESSAGE_ACCEPTED_HELPRETURNED));
    });
});