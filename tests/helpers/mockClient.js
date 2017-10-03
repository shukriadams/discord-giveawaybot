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
        if (this._nextMember){
            try{
                return this._nextMember;
            } finally {
                this._nextMember = null;
            }
        } else
            throw 'member not set';
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
        if (this._nextMessage)
            return this._nextMessage;
        else
            throw 'message not set';
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


    login(appkey){

    }
}

module.exports = Client;

