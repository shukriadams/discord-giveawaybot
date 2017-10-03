let hi = require('.//highlight');

module.exports = {
    permissionError : `You don't have permission to do this.`,
    timeFormat : 'Time should be a digit followed by m, h or d (minutes, hours or days). Egs., 1m is 1 minute, 10h is 10 hours, 4d is 4 days.',
    listArgumentsError : `Invalid command. Expected : ${hi('list')}, or ${hi('list all')}.`
};