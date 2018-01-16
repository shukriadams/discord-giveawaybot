class MockStore {
    constructor(){
        this._records = [];
    }

    // use this to force contents of store. all methods which return a list of records will return records passed in
    setRecords(records){
        this._records = records;
    }

    getWinnings(){
        return this.list();
    }

    getComparableWinning(){
        return this.list();
    }

    getActive(){
        return this.list();
    }

    list(){
        return this._records;
    }

    add(){
        return { id : 'whatever'}
    }

    clean(){
    }

    delete(){ }

    update(){ }

    get(){
        let records = this.list();
        if (records.length)
            return records[0];
        return null;
    }

    flush(){
        this._records = [];
    }
}

module.exports = MockStore;