/**
 * Converts shorthand time (eg 1m, 10D, 100h) into an object containing the original time value, that value converted
 * to minutes, and the unit (m, h or d).
 *
 * Returns null if input doesn't match the shorthand format.
 */
module.exports = function getTime(input){
    if (input === null || input === undefined)
        return null;

    let time = input.match(/\d/g);
    if (!time)
        return null;

    time = time.join('');

    let unit = input.replace(time, '').toLowerCase();
    if (unit !== 'd' && unit !== 'h' && unit !== 'm')
        return null;

    let minutes = time;
    if (unit === 'd')
        minutes = time * 24 * 60;
    else if (unit === 'h')
        minutes = time * 60;

    return {
        unit : unit,
        time : time,
        minutes : minutes
    }
};