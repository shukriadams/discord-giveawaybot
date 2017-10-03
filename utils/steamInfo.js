/**
 * Queries steam API to get a game's name, price, and whatever other data can be gleaned.
 */

let _instance,
    request = require('request-promise-native');

class SteamInfo{
    async get(steamId, url){
        let result = {
            success : false,
            price : null,
            steamName : null
        };

        // verify link with get to steam
        let body = await request({ url : url });

        let bodyJson = JSON.parse(body);

        if (!bodyJson[steamId].success)
            return result;

        // steam price is listed in cents of currency, /100 to convert to dollars or euros
        result.price = bodyJson[steamId].data.price_overview.initial / 100;
        result.steamName = bodyJson[steamId].data.name;
        result.success = true;

        return result;
    }
}

module.exports = {

    instance(){
        if (!_instance)
            _instance = new SteamInfo();

        return _instance;
    },

    set(newInstance){
        _instance = newInstance;
    }
};
