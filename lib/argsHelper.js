let argParser = require('minimist-string');

module.exports = {
    stringSplit : function(raw){
        raw = this.sanitize(raw);
        let args = raw.split(' ');
        return args.filter(function(arg){
            return arg && arg.length? arg: null;
        });
    },

    // converts text into minimist-string args object
    toArgsObject : function(raw){
        raw = this.sanitize(raw);
        return argParser(raw);
    },

    sanitize : function (raw){
        return raw.trim().replace(/\s+/g, ' ');
    }
};