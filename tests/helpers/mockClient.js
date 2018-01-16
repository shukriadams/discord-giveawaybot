let Collection = require('./collection')
    GuildMember = require('./mockGuildMember');





class Guild {

    constructor(){
        this._nextMember = new GuildMember();
        this._nextMember.permission = false;
    }

    setNextMember(guildMember){
        this._nextMember = guildMember;
    }

    async fetchMember(){
        return this._nextMember;
    }
}

class Channel {
    constructor(id){
        this.id = id;
        this.guild = new Guild();
    }

    setNextMessage(message){
        this._nextMessage = message;
    }

    async fetchMessage(){
        return this.send();
    }

    async send(){
        return this._nextMessage;
    }
}

class Client{

    constructor(bot){
        this.events = {};
        this.channels = new Collection();

        // always add giveawaychanel to client
        this.channels.add(new Channel('giveawaychannel'));

        // this is the bot user, with a hardcoded id of 1234
        this.user = {
            id : 1234
        };

        this.users = {
            get : async function(){
                return this._nextUser;
            }.bind(this)
        };

        this.bot = bot;
    }

    setNextUser(user){
        this._nextUser = user;
    }

    async fetchUser(){
        return this._nextUser;
    }

    async raiseMessageEvent(message){
        return await this.bot._onMessage(message);
    }

    on(){

    }

    login(appkey){

    }
}

module.exports = Client;

