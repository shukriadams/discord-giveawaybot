let assert = require('./../../helpers/assert'),
    codes = require('./../../../utils/codes'),
    Store = require('./../../../utils/store'),
    SteamInfo = require('./../../../utils/steamInfo'),
    GuildMember = require('./../../helpers/mockGuildMember'),
    makeMessage = require('./../../helpers/message'),
    test = require('./../../helpers/testBase');


test('queue command', function(testBase){

    it('should reject a queue command with too few args', async function() {
        let message = makeMessage(testBase.client.user.id);
        message.content += 'queue ab cd';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_INVALIDARGUMENTS, result);
    });

    it('should reject a queue command with too few args', async function() {
        let message = makeMessage(testBase.client.user.id);
        message.content += 'queue ab cd ef gh ij';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_INVALIDARGUMENTS, result);
    });

    it('should reject a queue command with invalid start time format', async function() {
        let message = makeMessage(testBase.client.user.id);
        message.content += 'queue ab cd ef';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_INVALIDTIMEFORMAT, result);
    });

    it('should reject a queue command with invalid duration time format', async function() {
        let message = makeMessage(testBase.client.user.id);
        message.content += 'queue 1m cd ef';

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_INVALIDTIMEFORMAT, result);
    });


    it('should reject a queue command from user that is not channel admin', async function() {
        let message = makeMessage(testBase.client.user.id);
        message.content += 'queue 1m 2d steamid';

        // make caller an admin
        let member = new GuildMember();
        member.permission = false;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_PERMISSION, result);
    });


    it('should reject a queue command with an invalid steamID', async function() {
        let message = makeMessage(testBase.client.user.id);
        message.content += 'queue 1m 2d steamid';

        // make caller an admin
        let member = new GuildMember();
        member.permission = true;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        let steamInfo = SteamInfo.instance();
        steamInfo.setNextInfo({
            success : false
        });

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_REJECTED_INVALIDSTEAMID, result);
    });


    it('should accept a queue command with a valid steamID', async function() {
        let message = makeMessage(testBase.client.user.id);
        message.content += 'queue 1m 2d steamid';

        // make caller an admin
        let member = new GuildMember();
        member.permission = true;
        testBase.client.channels.array()[0].guild.setNextMember(member);

        let steamInfo = SteamInfo.instance();
        steamInfo.setNextInfo({
            success : true
        });

        let result = await testBase.client.raiseMessageEvent(message);
        assert.equal(codes.MESSAGE_ACCEPTED, result);
    });

    // test capital timeformat!
});