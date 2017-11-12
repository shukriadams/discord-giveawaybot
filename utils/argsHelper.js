module.exports = {
    stringSplit : function(raw){
        let args = raw.split(' ');
        return args.filter(function(arg){
            return arg && arg.length? arg: null;
        });
    }
};