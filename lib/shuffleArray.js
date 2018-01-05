// from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
module.exports = function shuffle(inArray) {

    // clone array
    let array = inArray.slice(0),
        currentIndex = array.length;

    while (0 !== currentIndex) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        let temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
};
