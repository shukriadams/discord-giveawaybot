let settings = require('./settings').instance();

module.exports = {

    toString : function toString(bracket){
        return `${bracket.min}-${bracket.max}`;
    },

    findBracketForPrice : function findBracketForPrice(price){
        return settings.values.brackets ? settings.values.brackets.find(function(bracket){
            return bracket.min <= price && bracket.max >= price;
        }) : null;
    },

    fromString : function(string){
        return settings.values.brackets ? settings.values.brackets.find(function(bracket){
            return this.toString(bracket) === string;
        }.bind(this)) : null;
    }

};