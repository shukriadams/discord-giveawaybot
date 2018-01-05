let Settings = require('./settings');

module.exports = {

    toString : function toString(bracket){
        return `${bracket.min}-${bracket.max}`;
    },

    findBracketForPrice : function findBracketForPrice(price){
        let settings = Settings.instance();
        return settings.values.brackets ? settings.values.brackets.find(function(bracket){
            return bracket.min <= price && bracket.max >= price;
        }) : null;
    },

    fromString : function(string){
        let settings = Settings.instance();
        return settings.values.brackets ? settings.values.brackets.find(function(bracket){
            return this.toString(bracket) === string;
        }.bind(this)) : null;
    }

};