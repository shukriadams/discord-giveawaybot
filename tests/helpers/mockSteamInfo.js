class MockSteamInfo {

    setNextInfo(info){
        this.info = info;
    }

    async getInfo(){
        return this.info;
    }

    // is this still used??
    async get(){
        return this.info;
    }
}

module.exports = MockSteamInfo;

