let lokijs = require('lokijs'),
    fs = require('fs-extra'),
    settings,
    path = require('path'),
    bracketHelper = require('./bracketHelper'),
    cwd = require('process').cwd(),
    _instance;

class Store {

    constructor(onReady){
        settings = require('./settings').instance();

        let keys = { },
            table = 'store';

        // ensure path
        let saveDir = path.join(cwd, '__store');
        if (!fs.existsSync(saveDir))
            fs.ensureDirSync(saveDir);

        let savePath = path.join(saveDir, 'data.json');

        this.database = new lokijs(savePath, {
            autosave : true,
            autosaveInterval : 3000
        });

        if (fs.existsSync(savePath)){
            this.database.loadDatabase({}, function(err){

                if (err)
                    throw new Error(err);

                this._table = this.database.getCollection(table);

                if (!this._table)
                    this._table = this.database.addCollection(table, keys);

                if (onReady)
                    onReady(this);
            }.bind(this));
        } else {
            this._table = this.database.addCollection(table, keys);
            if (onReady)
                onReady(this);
        }
    }

    static _convert (record){
        return {
            id : record.$loki.toString(),
            comment : record.comment,
            ownerId : record.ownerId,                   // discord userid, creator of giveaway
            start : record.start,                       //
            startMinutes : record.startMinutes,         // minutes after this.created when giveaway should start
            duration : record.duration,                 // TODO : refactor out
            durationMinutes : record.durationMinutes,   // minutes after this.started that giveaway should close
            urlMessageId : record.urlMessageId,//
            startMessageId: record.startMessageId,      // dischord messageid announcing giveaway
            participants : record.participants,         // array of dischord userids
            status : record.status,                     // string : pending|open|closed|cancelled
            code : record.code,                         // steam activation code. used only for queued giveaways
            winnerId: record.winnerId,                  // discord userid, winner of giveaway
            rejectedWinners : record.rejectedWinners,   // array of userids
            created : record.created,                   // javascript date in ms, when giveaway was created
            started : record.started,                   // javascript date in ms, when giveaway started
            ended : record.ended,                       // javascript date in ms, when giveaway ended (or was cancelled)
            steamId : record.steamId,                   // id of steam game being given away
            steamName : record.steamName,               // name of steam game being given away
            channelId : record.channelId,               // discord channel id giveaway was created in
            price : record.price,                       // price of steam game at time giveaway created
            bracket : record.bracket,                   // bracket into which price falls
            lastUpdated : record.lastUpdated            // javascriåt date in ms, used for active state only, last time "ends" time written to discord
        };
    }

    static _convertAll(records){
        let result = [];

        // convert loki objects to database-agnostic objects
        for (let i = 0 ; i < records.length ; i ++)
            result.push(Store._convert(records[i]));

        return result;
    }

    // gets all user winnings in last active period
    getWinnings(userId){
        let date = new Date();
        date.setDate(date.getDate() - settings.values.winningCooldownDays);

        let winningsRaw = this._table.find({ '$and' : [
            { 'ended' : { '$gt' : date.getTime() } },
            { status : 'closed' },
            { winnerId : userId }
        ]});

        if (winningsRaw.length === 0)
            return [];

        let winnings = Store._convertAll(winningsRaw);
        winnings.sort(function(a,b){
            return a.ended < b.ended ? 1 :
                a.ended > b.ended ? -1 :
                    0;
        });

        return winnings;
    }

    // gets last winning in last active period for any game within the give price bracket range
    getComparableWinning(userId, gamePrice){
        let date = new Date();
        date.setDate(date.getDate() - settings.values.winningCooldownDays);

        // check if user won game in price range
        let bracket = bracketHelper.findBracketForPrice(gamePrice);
        if (!bracket)
            return null;

        let winningsRaw = this._table.find({ '$and' : [
            { 'bracket' : bracketHelper.toString(bracket) },
            { 'ended' : { '$gt' : date.getTime() } },
            { status : 'closed' },
            { winnerId : userId }
        ]});
        if (winningsRaw.length === 0)
            return null;

        let winnings = Store._convertAll(winningsRaw);
        winnings.sort(function(a,b){
            return a.ended < b.ended ? 1 :
                a.ended > b.ended ? -1 :
                0;
        });

        return winnings[0];
    }

    add(object){
        let record = this._table.insert(object);
        return Store._convert(record);
    }

    list(query){
        query = query || { };

        let records = this._table.find(query);

        // convert loki objects to database-agnostic objects
        return Store._convertAll(records);
    }

    getActive(){
        return this.list({ '$or' : [
            { status : 'pending' },
            { status : 'open'}
        ]});
    }

    delete(id){
        let existingRecord = this._table.get(parseInt(id));
        if (!existingRecord)
            return;

        this._table.remove(existingRecord);
    }

    clean(){
        let date = new Date();

        date.setDate(date.getDate() - 14);

        let records = this._table.find({ '$and' : [
            { 'ended' : { '$lt' : date.getTime() } }
        ]});

        for (let record of records)
            this._table.remove(record);
    }

    get(id){
        let existingRecord = this._table.get(parseInt(id));
        if (!existingRecord)
            return null;

        return Store._convert(existingRecord);
    }

    update(object){
        let existingRecord = this._table.get(parseInt(object.id));
        if (!existingRecord)
            return;

        for (let property in object){
            // id is an artificial property added on returned objects only, so do not persist it
            if (property === 'id')
                continue;

            existingRecord[property] = object[property];
        }

        this._table.update(existingRecord);
    }
}

module.exports = {
    async instance (){
        return new Promise(async function(resolve, reject) {
            try {
                if (_instance)
                    return resolve(_instance);

                new Store(function(inst){
                    _instance = inst;
                    resolve(inst)
                });

            } catch (ex){
                reject(ex);
            }
        }.bind(this));
    },

    set (newInstance){
        _instance = newInstance;
    }
}
;

