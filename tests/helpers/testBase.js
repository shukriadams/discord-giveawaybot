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
        let Settings = require('./../../utils/settings'),
            Store = require('./../../utils/store'),
            SteamInfo = require('./../../utils/steamInfo'),
            Client = require('./../../utils/clientProvider');

        let Bot = require('./../../bot'),
            bot = new Bot(),
            store = new MockStore(),
            steamInfo = new MockSteamInfo(),
            client = new MockClient(bot),
            settings = {
                save : function(){ },
                values : {
                    token : 'whatever',
                    giveawayChannelId : 'giveawaychannel'
            }};

        SteamInfo.set(steamInfo);
        Settings.set(settings);
        Client.set(client);
        Store.set(store);

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

