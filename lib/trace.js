/**
 * Trace is used during testing to mark return points in production code. Marking lets us confirm that a particular
 * condition has been met. Tracing is silenced during production, and its code footprint in production must be as
 * unintrusive as possible.
 */

let _instance;

/**
 * Production trace always returns the first arg and ignores everything else. The test version of trace will logic
 * to handle/store other args.
 */
function trace(arg1){
    return arg1;
}


module.exports = {
    instance : function(){
        if (!_instance)
            _instance = trace;

        return _instance;
    },
    set : function(newInstance){
        _instance = newInstance;
    }
};
