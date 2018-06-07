
/**
 * Returns an array of all users from messagereaction, spanning multiple queries if necessary.
 *
 */
let getAllReactionUsers = async function(messageReaction){
    return new Promise(async function(resolve, reject){
        try {
            let users = [],
                lastUserId;

            while(true){
                let options = {};
                if (lastUserId)
                    options.after = lastUserId;
                let fetchedUsers = await messageReaction.fetchUsers(100, options );
                fetchedUsers = fetchedUsers.array();
                if (fetchedUsers.length === 0)
                    break;

                for (let fetchedUser of fetchedUsers){
                    users.push(fetchedUser);
                    lastUserId = fetchedUser.id;
                }
                // force break, discord's .after or .before argument still not working -_-
                break;
            }
            resolve(users);
        } catch(ex){
            reject(ex);
        }
    });
};

module.exports = {
    getAllReactionUsers
}