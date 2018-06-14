/**
 * Use this instead of index.js if you want to start the bot directly from the command line. If you're trying to debug
 * the bot, this is also the file you want to start your debugger on.
 */

(async function(){
    let Bot = require('./lib/bot'),
        bot = new Bot();

    await bot.start();
})();
