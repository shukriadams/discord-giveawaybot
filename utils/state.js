/**
 * State is a singleton holder that the bot can write to. This is meant to serve as a public log of the bot's health.
 * State can be queried by channel users. The bot can also periodically broadcast it's health to warn of serious errors,
 * but without spamming.
 */

class State
{
    constructor(){
        this.content = {};
    }

    add(category, message){
        this.content[category] = message;
    }

    remove (category){
        if (this.content[category])
            delete this.content[category];
    }

    clear(){
        this.content = {};
    }

    length(){
        return Object.keys(this.content).length;
    }

    get(){
        let state = [];
        for (let property in this.content)
            state.push(this.content[property])

        return state;
    }

}

let _instance = null;

module.exports = {
    instance(){
        if (!_instance)
            _instance = new State();

        return _instance;
    }
};
