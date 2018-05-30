let assert = require('./../../helpers/assert'),
    codes = require('./../../../lib/codes'),
    GuildMember = require('./../../helpers/mockGuildMember'),
    makeMessage = require('./../../helpers/message'),
    Store = require('./../../../lib/store'),
    test = require('./../../helpers/testBase');

test('cancel command', async function(testBase){

    it('should reject a cancel command with no arg', async function() {

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'cancel';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_INVALIDARGUMENTS, result);
    });

    it('should reject a cancel command with two args', async function() {

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'cancel abc 123';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_INVALIDARGUMENTS, result);
    });

    it('should reject a cancel command if id not a number', async function() {

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'cancel -i abc';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_INVALIDINT, result);
    });

    it('should reject a cancel command if giveaway does not exist', async function() {

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'cancel -i 123';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_GIVEAWAYNOTFOUND, result);
    });

    it('should reject a cancel command if user not administrator and not owner', async function() {
        let store = await Store.instance();

        // force user to not have admin permission
        let member = new GuildMember();
        member.permission = false;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        store.setRecords([{
            id : 123,
            ownerId : 'zxy'
        }]);

        let message = await makeMessage(testBase.client.user.id);
        message.author.id = 'abc';
        message.content = 'cancel -i 123';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_PERMISSION, result);
    });

    it('should reject a cancel command if user not giveaway owner', async function() {
        let store = await Store.instance();

        // set giveaway user to xyz, and message id to abc
        store.setRecords([{
            id : 123,
            ownerId : 'zxy',
        }]);

        //
        let message = await makeMessage(testBase.client.user.id);
        message.author.id = 'abc';
        message.content = ' cancel -i 123';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_PERMISSION, result);
    });

    it('should reject a cancel command if giveaway is closed and user is not admin', async function() {
        let store = await Store.instance();

        // set giveaway user to xyz, and message id to abc
        store.setRecords([{
            id : 123,
            status : 'closed',
            ownerId : 'abc',
        }]);

        //
        let message = await makeMessage(testBase.client.user.id);
        message.author.id = 'abc';
        message.content = 'cancel -i 123';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_PERMISSION, result);
    });

    it('should accept a cancel command if giveaway is closed and user is admin', async function() {
        let store = await Store.instance();

        let member = new GuildMember();
        member.permission = true;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        // set giveaway user to xyz, and message id to abc
        store.setRecords([{
            id : 123,
            status : 'closed',
            ownerId : 'abc',
        }]);

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'cancel -i 123';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_ACCEPTED, result);
    });

});