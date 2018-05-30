let assert = require('./../../helpers/assert'),
    codes = require('./../../../lib/codes'),
    GuildMember = require('./../../helpers/mockGuildMember'),
    makeMessage = require('./../../helpers/message'),
    test = require('./../../helpers/testBase');

test('channel command', function(testBase){

    it('should reject a user that is not admin', async function() {

        // mimic structure of a valid discord, with invalid command
        let message = await makeMessage(testBase.client.user.id);
        message.content = `<@${testBase.client.user.id}> channel`;
        message.channel.type = '';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_PERMISSION, result);
    });


    it('should reject a dm from an admin', async function() {
        // make caller an admin
        let member = new GuildMember();
        member.permission = true;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        // mimic structure of a valid discord, with invalid command
        let message = await makeMessage(testBase.client.user.id);
        message.content = 'channel';
        message.channel.type = 'dm';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_INVALIDCHANNEL, result);
    });

    it('should accept a channel set from admin', async function() {
        // make caller an admin
        let member = new GuildMember();
        member.permission = true;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        // mimic structure of a valid discord, with invalid command
        let message = await makeMessage(testBase.client.user.id);
        message.content = `<@${testBase.client.user.id}> channel`;
        message.channel.type = '';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_ACCEPTED, result);
    });
});