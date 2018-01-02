/**
 * The daemon is the background process of the bot which runs independent of user messages. The daemon starts and
 * ends giveaways, triggers data cleanups and other autonomous activity.
 */
let winston = require('winston'),
    busy = false,
    daemonTick = require('./daemonTick'),
    CronJob = require('cron').CronJob;

module.exports = async function daemon (){

    // every 5 seconds
    new CronJob('*/5 * * * * *', async function daemonCron() {

        try
        {
            // use busy flag to prevent the daemon from running over itself
            if (busy)
                return;
            busy = true;

            await daemonTick();

        } catch (ex){
            winston.error(ex);
            console.log(ex);
        } finally {
            busy = false;
        }

    },  null, true);

};

