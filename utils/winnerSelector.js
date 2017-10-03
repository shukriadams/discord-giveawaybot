let Store = require('./store'),
    settings = require('./settings').instance(),
    shuffleArray = require('./shuffleArray');

/**
 * Processes giveaway, attempts to find winner. A winner isn't guaranteed.
 */
module.exports =  async function(giveaway){
    return new Promise(async function(resolve, reject){
        try {
            let store = await Store.instance();

            // if giveaway already has a winner, push that winner to rejected list
            if (giveaway.winnerId)
                giveaway.rejectedWinners.push(giveaway.winnerId);

            giveaway.winnerId = null;

            // try to get user with strictest rules. if no winner found, start relaxing rules
            let winnerId = null,
                participants = shuffleArray(giveaway.participants);

            while(participants.length){
                let userID = participants.splice([participants.length - 1], 1)[0];

                // user can fail if previously rejected (if giveaway was manually rerolled)
                if (giveaway.rejectedWinners.indexOf(userID) !== -1)
                    continue;

                winnerId = userID;
                break;
            }

            if (winnerId)
                giveaway.winnerId = winnerId;

            giveaway.winnerId = winnerId;
            if (!giveaway.winnerId)
                giveaway.comment = 'Unable to allocate winner';

            resolve();

        } catch (ex){
            reject(ex);
        }

    });
};
