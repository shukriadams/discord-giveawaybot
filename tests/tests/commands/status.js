let assert = require('./../../helpers/assert'),
    codes = require('./../../../lib/codes'),
    GuildMember = require('./../../helpers/mockGuildMember'),
    makeMessage = require('./../../helpers/message'),
    test = require('./../../helpers/testBase');

test('status command', function(testBase){

    it('should reject a status command from non admin', async function() {

        // mnimic structure of a valid discord, with invalid command
        let message = await makeMessage(testBase.client.user.id);
        message.content += 'status';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_PERMISSION, result);
    });

    it('should accept a status command from admin', async function() {

        // make user admin
        let member = new GuildMember();
        member.permission = true;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        // mnimic structure of a valid discord, with invalid command
        let message = await makeMessage(testBase.client.user.id);
        message.content += 'status';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_ACCEPTED, result);
    });

});