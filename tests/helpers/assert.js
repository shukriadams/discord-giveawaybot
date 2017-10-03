let assert = require('assert');

module.exports = {

    equal : function(a, b, message){
        assert.equal(a, b, message);
    },

    fail : function(message){
        assert.equal(true, false, message);
    },

    zero : function(a, message){
        assert.equal(a, 0, message);
    },

    true : function(a, message){
        assert.equal(a, true, message);
    },

    null : function(a, message){
        assert.equal(a, null, message);
    },

    notNull : function(a, message){
        assert.equal(a === null, false, message);
    }
};