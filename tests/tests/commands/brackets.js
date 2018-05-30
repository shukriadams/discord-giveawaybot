let assert = require('./../../helpers/assert'),
    GuildMember = require('./../../helpers/mockGuildMember'),
    codes = require('./../../../lib/codes'),
    makeMessage = require('./../../helpers/message'),
    Settings = require('./../../../lib/settings'),
    test = require('./../../helpers/testBase');

test('bracket command', function(testBase){

    it('should accept a brackets list command for any user', async function() {

        // set non-admin user
        let member = new GuildMember();
        member.permission = false;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'brackets';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_ACCEPTED_BRACKETSLIST, result);
    });

    it('should reject a bracket set command if user not administrator', async function() {

        // force user to not have admin permission
        let member = new GuildMember();
        member.permission = false;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'brackets -b 0-100-200';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_PERMISSION, result);
    });

    it('should reject a brackets command if invalid args given', async function() {

        // make user admin
        let member = new GuildMember();
        member.permission = true;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'brackets abcd xwy';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_INVALIDARGUMENTS, result);
    });

    it('should reject a brackets command if bracket contains only 1 bracket', async function() {

        // make user admin
        let member = new GuildMember();
        member.permission = true;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'brackets -b 0-';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_INVALIDBRACKET, result);
    });

    it('should reject a brackets command if bracket contains non numeric chars', async function() {

        // make user admin
        let member = new GuildMember();
        member.permission = true;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'brackets -b 0-a';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_INVALIDBRACKET, result);
    });

    it('should create two brackets ', async function() {

        // make user admin
        let member = new GuildMember();
        member.permission = true;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        let message = await makeMessage(testBase.client.user.id);
        message.content = 'brackets -b 0-100-200';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_ACCEPTED, result);

        let settings = Settings.instance();
        assert.equal(settings.values.brackets.length, 2);
        assert.equal(settings.values.brackets[0].min, 0);
        assert.equal(settings.values.brackets[0].max, 100);
        assert.equal(settings.values.brackets[1].min, 100);
        assert.equal(settings.values.brackets[1].max, 200);
    });
});