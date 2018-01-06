class TestTrace{

    constructor(){
        this._calls = {};
    }

    trace(arg1, arg2){
        let identifier = !arguments.length ? null :
            arguments.length === 1 ? arg1 : arg2;

        if (!identifier)
            throw new Error('TestTrace trace() called with no arguments');

        this._calls[identifier] = { };
    }

    has(identifier) {
        return this._calls[identifier] !== undefined;
    }

    clear(){
        this._calls = {};
    }

};

module.exports = TestTrace;