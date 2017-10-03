/**
 * Used for testing, shims discord's collection type.
 */
module.exports = class {
    constructor(startingArray){
        if (!startingArray)
            startingArray = [];

        this._array = startingArray;
        this.size = startingArray.length;
    }

    find(propertyName, value){
        return this._array.find(function(item){
            return item.hasOwnProperty(propertyName) && item[propertyName] === value ?
                item[propertyName] : null;
        });
    }

    add(object){
        this._array.push(object);
    }

    array(){
        return this._array;
    }

};