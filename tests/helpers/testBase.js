/**
 * Simple scaffold to run mocha tests on an express server instance.
 */
let MockClient = require('./mockClient'),
    MockSteamInfo = require('./mockSteamInfo'),
    MockLogger = require('./mockLogger'),
    TestTrace = require('./testTrace'),
    MockStore = require('./mockStore');

module.exports = function(testName, tests){

    describe(testName, function() {
        this.timeout(5000);

        // inject test structures into singletons
        let Settings = require('./../../lib/settings'),
            Store = require('./../../lib/store'),
            Logger = require('./../../lib/logger'),
            Trace = require('./../../lib/trace'),
            GameInfo = require('./../../lib/gameInfo');

        let store = new MockStore(),
            steamInfo = new MockSteamInfo(),
            testTrace = new TestTrace(),
            mockLogger = new MockLogger(),
            settings = {
                save : function(){ },
                values : {
                    token : 'whatever',
                    giveawayChannelId : 'giveawaychannel',
                    brackets : []
            }};

        // set shims before importing bot
        // trace set twice because its being overwritten somewhere ...
        Trace.set(function(){
            testTrace.trace.apply(testTrace, arguments);
        });
        Logger.set(mockLogger);
        GameInfo.set(steamInfo);
        Settings.set(settings);
        Store.set(store);

        let Bot = require('../../lib/bot'),
            Client = require('./../../lib/clientProvider'),
            bot = new Bot({nocron : true}),
            client = new MockClient(bot);

        Client.set(client);
        bot.start();

        // forces comparinator to create new data files for testing, so we don't have to trash "real" data
        tests({
            bot : bot,
            trace : testTrace,
            client : client,
            store : store, // refactor this out, it's unreliable
            steamInfo : steamInfo,
            settings : settings
        });

        beforeEach(function(done) {
            (async ()=>{

                let settings = {
                    save : function(){ },
                    values : {
                        token : 'whatever',
                        giveawayChannelId : 'giveawaychannel',
                        brackets : []
                }};

                Settings.set(settings);
                let store = await Store.instance();
                store.flush();
                testTrace.clear();
                // trace set twice because its being overwritten somewhere ...
                Client.set(client);
                Trace.set(function(){
                    testTrace.trace.apply(testTrace, arguments);
                });
                // setup
                done();
            })();
        });

        afterEach(function(done){
            // teardown
            done();
            bot.stop();
        });
    });
};

