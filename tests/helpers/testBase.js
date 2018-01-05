/**
 * Simple scaffold to run mocha tests on an express server instance.
 */
let MockClient = require('./mockClient'),
    MockSteamInfo = require('./mockSteamInfo'),
    MockStore = require('./mockStore');

module.exports = function(testName, tests){

    describe(testName, function() {
        this.timeout(5000);

        // inject test structures into singletons
        let Settings = require('./../../lib/settings'),
            Store = require('./../../lib/store'),
            GameInfo = require('./../../lib/gameInfo');

        let store = new MockStore(),
            steamInfo = new MockSteamInfo(),
            settings = {
                save : function(){ },
                values : {
                    token : 'whatever',
                    giveawayChannelId : 'giveawaychannel',
                    brackets : []
            }};

        // set tes shims before importing bot
        GameInfo.set(steamInfo);
        Settings.set(settings);
        Store.set(store);

        let Bot = require('../../lib/bot'),
            Client = require('./../../lib/clientProvider'),
            bot = new Bot(),
            client = new MockClient(bot);

        Client.set(client);
        bot.start();

        // forces comparinator to create new data files for testing, so we don't have to trash "real" data
        tests({
            bot : bot,
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

                // setup
                done();
            })();
        });

        afterEach(function(done){

            // teardown
            done();
        });
    });
};

