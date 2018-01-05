let assert = require('./../helpers/assert'),
    codes = require('./../../lib/codes'),
    makeMessage = require('./../helpers/message'),
    Collection = require('./../helpers/collection'),
    test = require('./../helpers/testBase');

test('invalid input', function(testBase){

    it('should reject a message from another bot', async function() {


        let message = makeMessage('emptyid');
        // set message to appear like it's from another bot
        message.author.bot = true;

        let result = await testBase.client.raiseMessageEvent(message);

        assert.equal(codes.MESSAGE_REJECTED_BOT, result);
    });

    it('should reject global messages', async function() {

        let message = makeMessage('emptyId');
        // mimic structure of a discord group message
        message.mentions.everyone = {};

        let result = await testBase.client.raiseMessageEvent(message);

        assert.equal(codes.MESSAGE_REJECTED_GLOBAL, result);
    });

    it('should reject group messages that the bot is included in', async function() {

        let message = makeMessage('emptyId');
        // mimic structure of a discord group message with more than person in it
        message.mentions.users = new Collection([ {}, {} ]);

        let result = await testBase.client.raiseMessageEvent(message);

        assert.equal(codes.MESSAGE_REJECTED_GROUPMESSAGE, result);
    });

    it('should reject message not aimed at the bot user', async function() {

        let message = makeMessage(testBase.client.user.id);
        // mnimic structure of a discord message aimed at user other than bot
        message.mentions.users = new Collection([ { id : 4321} ]);

        let result = await testBase.client.raiseMessageEvent(message);

        assert.equal(codes.MESSAGE_REJECTED_UNTARGETED, result);
    });

    it('should reject message with an unknown command', async function() {

        // mnimic structure of a valid discord, with invalid command
        let message = makeMessage(testBase.client.user.id);
        let result = await testBase.client.raiseMessageEvent(message);

        assert.equal(codes.MESSAGE_REJECTED_UNKNOWNCOMMAND, result);
    });

    it('should reject message if giveaway channel not set', async function() {

        let message = makeMessage(testBase.client.user.id);

        // force blank the giveawaychannelid
        testBase.settings.values.giveawayChannelId = null;

        message.content += ' help';

        let result = await testBase.client.raiseMessageEvent(message);

        assert.equal(codes.MESSAGE_REJECTED_CHANNELNOTSET, result);
    });




});