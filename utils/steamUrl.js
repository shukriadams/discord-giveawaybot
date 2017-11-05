/**
 *
 */

module.exports = {

    /**
     * Gets steamId and steam API url of a game, from raw user input.
     * input : Can be either a steam game ID (egs: 379720) or a full url for the game
     * (egs: http://store.steampowered.com/app/379720/DOOM).
     * Note, this does not test the validity of the input, it merely handles if input is ID or full url.
     */
    getInfo : function(input){
        let pattern = /\/app\/([0-9]*)\//;
        let matches = input.match(pattern);

        let steamId = null;
        if (matches && matches.length === 2){
            steamId = matches[1];
        } else {
            // assume input is an id
            steamId = input;
        }

        let steamUrl = `http://store.steampowered.com/api/appdetails?cc=us&appids=${steamId}`;
        return {
            steamId : steamId,
            steamUrl : steamUrl
        };

    },

    /**
     * Returns full Steam API url for a Steam game ID.
     */
    getUrl(id){
        return `http://store.steampowered.com/app/${id}`;
    }



};