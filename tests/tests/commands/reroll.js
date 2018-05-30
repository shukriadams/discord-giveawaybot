let assert = require('./../../helpers/assert'),
    codes = require('./../../../lib/codes'),
    Store = require('./../../../lib/store'),
    GuildMember = require('./../../helpers/mockGuildMember'),
    MockMessage = require('./../../helpers/mockMessage'),
    makeMessage = require('./../../helpers/message'),
    test = require('./../../helpers/testBase');

test('reroll command', function(testBase){

    it('should reject a reroll command if too few args', async function() {
        let message = await makeMessage(testBase.client.user.id);
        message.content = 'reroll';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_INVALIDARGUMENTS, result);
    });

    it('should reject a reroll command if too many args', async function() {
        let message = await makeMessage(testBase.client.user.id);
        message.content = 'reroll thing stuff';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_INVALIDARGUMENTS, result);
    });

    it('should reject a reroll command if id is not an int', async function() {
        let message = await makeMessage(testBase.client.user.id);
        message.content = 'reroll -i thing';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_INVALIDINT, result);
    });

    it('should reject a reroll command if giveaway does not exist', async function() {
        let message = await makeMessage(testBase.client.user.id);
        message.content = 'reroll -i 1';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_GIVEAWAYNOTFOUND, result);
    });

    it('should reject a reroll command if user is not admin', async function() {
        // make caller an admin
        let member = new GuildMember();
        member.permission = false;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'reroll -i 1';
        message.author.id = 'abc';

        let store = await Store.instance();
        // force a give away to ensure we enter the per-giveaway loop and cover as much as code as possible
        store.setRecords([{
            created : new Date().getTime(),
            ownerId : 'xyz',
            participants : []
        }]);

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_PERMISSION, result);
    });

    it('should reject a reroll command if there are no participants in giveaway', async function() {
        // make caller an admin
        let member = new GuildMember();
        member.permission = true;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'reroll -i 1';

        let store = await Store.instance();
        // force a give away to ensure we enter the per-giveaway loop and cover as much as code as possible
        store.setRecords([{
            created : new Date().getTime(),
            status : 'closed',
            participants : []
        }]);

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_NOPARTICIPANTS, result);
    });

    it('should reject a reroll command if there are no available participants in giveaway', async function() {
        // make caller an admin
        let member = new GuildMember();
        member.permission = true;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'reroll -i 1';

        let store = await Store.instance();
        // force a give away to ensure we enter the per-giveaway loop and cover as much as code as possible
        store.setRecords([{
            created : new Date().getTime(),
            participants : ['bbb'],
            status : 'closed',
            rejectedWinners : ['bbb']
        }]);

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_NOAVAILABLEPARTICIPANTS, result);
    });

    it('should reject a reroll command if the giveaway is not closed', async function() {
        // make caller an admin
        let member = new GuildMember();
        member.permission = true;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'reroll -i 1';

        let store = await Store.instance();
        // force a give away to ensure we enter the per-giveaway loop and cover as much as code as possible
        store.setRecords([{
            created : new Date().getTime(),
            participants : [],
            status : 'open'
        }]);

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_NOTCLOSED, result);
    });

    it('should accept a reroll command', async function() {
        // make caller an admin
        let member = new GuildMember();
        member.permission = true;
        testBase.client.channels.array()[0].guild.setNextMember(member);
        testBase.client.setNextUser({});
        // add dummy message giveaway message
        testBase.client.channels.array()[0].setNextMessage(new MockMessage());

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'reroll -i 1';

        let store = await Store.instance();
        // force a give away to ensure we enter the per-giveaway loop and cover as much as code as possible
        let giveaway = {
            created : new Date().getTime(),
            status : 'closed',
            participants : ['towin'],
            winnerId : 'tolose',
            rejectedWinners : []
        };
        store.setRecords([giveaway]);

        testBase.client.setNextUser({ username : 'name', send : function(){} }); // todo : user a proper user object instead of tacking functions on anon objs

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_ACCEPTED, result);
        assert.equal(giveaway.winnerId, 'towin');
        assert.true(giveaway.rejectedWinners.indexOf('tolose') !== -1)
    });

});