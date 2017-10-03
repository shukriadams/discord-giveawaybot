let Collection = require('./collection');

class MockGuildMember{
    constructor(){
        this.permission = false;
        this.roles = new Collection();
    }

    hasPermission(){
        return this.permission;
    }
}

module.exports = MockGuildMember;