let assert = require('./../../helpers/assert'),
    GuildMember = require('./../../helpers/mockGuildMember'),
    codes = require('./../../../utils/codes'),
    makeMessage = require('./../../helpers/message'),
    test = require('./../../helpers/testBase');

test('bracket command', function(testBase){

    it('should reject a brackets command if user not administrator', async function() {

        // force user to not have admin permission
        let member = new GuildMember();
        member.permission = false;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        // mnimic structure of a valid discord, with invalid command
        let message = makeMessage(testBase.client.user.id);
        message.content += 'brackets';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_PERMISSION, result);
    });

    it('should accept a brackets command if no args given', async function() {

        // make user admin
        let member = new GuildMember();
        member.permission = true;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        // mnimic structure of a valid discord, with invalid command
        let message = makeMessage(testBase.client.user.id);
        message.content += 'brackets';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_ACCEPTED_BRACKETSLIST, result);
    });

    it('should reject a brackets command if too many args given', async function() {

        // make user admin
        let member = new GuildMember();
        member.permission = true;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        // mnimic structure of a valid discord, with invalid command
        let message = makeMessage(testBase.client.user.id);
        message.content += 'brackets abcd xwy';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_INVALIDARGUMENTS, result);
    });

    it('should reject a brackets command if bracket contains only 1 bracket', async function() {

        // make user admin
        let member = new GuildMember();
        member.permission = true;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        // mnimic structure of a valid discord, with invalid command
        let message = makeMessage(testBase.client.user.id);
        message.content += 'brackets 0-';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_INVALIDBRACKET, result);
    });

    it('should reject a brackets command if bracket contains non numeric chars', async function() {

        // make user admin
        let member = new GuildMember();
        member.permission = true;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        // mnimic structure of a valid discord, with invalid command
        let message = makeMessage(testBase.client.user.id);
        message.content += 'brackets 0-a';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_INVALIDBRACKET, result);
    });

    it('should create two brackets ', async function() {

        // make user admin
        let member = new GuildMember();
        member.permission = true;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        // mnimic structure of a valid discord, with invalid command
        let message = makeMessage(testBase.client.user.id);
        message.content += 'brackets 0-100-200';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_ACCEPTED, result);

        assert.equal(testBase.settings.values.brackets.length, 2);
        assert.equal(testBase.settings.values.brackets[0].min, 0);
        assert.equal(testBase.settings.values.brackets[0].max, 100);
        assert.equal(testBase.settings.values.brackets[1].min, 100);
        assert.equal(testBase.settings.values.brackets[1].max, 200);
    });
});