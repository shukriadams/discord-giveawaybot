/**
 * Tries to help out by inferring information about a game using only its url.
 * Information it can get :
 * - game name
 * - game price
 *
 * Name will always have a value, but the quality of that value varies. A Steam app's name can be read from the Steam
 * JSON API. If not a Steam app, we can usually get name from OpenGraph meta data in the page header (most pro sites do
 * this), failing that we'll use the standard HTML page title, even though this often has other unwanted text like site
 * title. If the page title is empty, we fall back to using the url as the game name.
 *
 * Price is available from Steam apps only, and is always read from the JSON API. Other platforms can be added later if
 * APIs are made available.
 *
 */

let _instance,
    Url = require('url'),
    cheerio = require('cheerio'),
    request = require('request-promise-native');

class GameInfo{

    /**
     * Args contains unsanitized user input. We will try to return the best possible info we can from whatever the user
     * inputs, if we can't find anything we replace args properties with null, and let validation deal with that later.
     *
     * Args : { price , gameName, url }
     */
    async getInfo(args){

        // first, ensure url
        if (!args.url)
            return args;

        let testUrl = null;

        try {

            testUrl = Url.parse(args.url);

            // is url a steam app ?
            if (testUrl.host && testUrl.host.toLowerCase() === 'store.steampowered.com'){
                args = await this._treatAsSteamApp(args);
            }

            // treat remainder, or steam pages that are not apps
            if (!args.success){
                args = await this._treatAsRegularHtml(args)
            }
        } catch(ex) {
            // todo : this is a terrible workaround to passing along a url error. all url sanitization needs to be rethought
            args.urlError = 'Url is invalid';
        }

        return args;
    }

    // body is optional, lets us recycle request from steam check
    async _treatAsRegularHtml(args, body){
        if (!body)
            body = await request({ url : args.url });

        let $ = cheerio.load(body),
            ogTitle = $('head meta[property="og:title"]').text(),
            rawTitle = $('head title').text();

        if (ogTitle.length)
            args.gameName = ogTitle;
        else{
            if (rawTitle.length)
                args.gameName = rawTitle;
            else
                args.gameName = args.url;
        }

        return args;
    }

    /**
     * Tries to convert a steam store url to a steam api url
     */
    _toSteamApiUrl(url){
        let pattern = /\/app\/([0-9]*)\/?/,
            matches = url.toLowerCase().match(pattern);

        if (matches && matches.length === 2)
            return `http://store.steampowered.com/api/appdetails?cc=us&appids=${matches[1]}`;

        return null;
    }

    async _treatAsSteamApp(args){

        // try to get api url
        let apiUrl = this._toSteamApiUrl(args.url);
        if (!apiUrl)
            return args;

        let body = await request({ url : apiUrl }),
            bodyJson;

        try {
            bodyJson = JSON.parse(body);
        } catch (ex){
            // failed to parse body, url is not a valid json api, treat as regular "dumb" url
            args = await this._treatAsRegularHtml(args, body);
            return args;
        }

        let bodyProperties = Object.keys(bodyJson);
        // steam returns first property in body as the game's steamId
        let steamId = bodyProperties.length ? bodyProperties[0] : '';

        // if app, the first property returned should have a success=true property
        if (bodyJson[steamId].success){
            // steam price is listed in cents of currency, /100 to convert to dollars or euros
            // note : free games have no price
            let price = bodyJson[steamId].data && bodyJson[steamId].data.price_overview && bodyJson[steamId].data.price_overview.initial ? bodyJson[steamId].data.price_overview.initial : 0;
            args.price = price / 100;
            args.gameName = bodyJson[steamId].data.name;
            args.success = true;
        }

        return args;
    }
}

module.exports = {

    instance(){
        if (!_instance)
            _instance = new GameInfo();

        return _instance;
    },

    set(newInstance){
        _instance = newInstance;
    }
};
