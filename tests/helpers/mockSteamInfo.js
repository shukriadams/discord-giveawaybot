class MockSteamInfo {

    setNextInfo(info){
        this.info = info;
    }

    async get(){
        return this.info;
    }
}

module.exports = MockSteamInfo;

