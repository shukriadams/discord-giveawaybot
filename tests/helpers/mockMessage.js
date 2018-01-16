let ClientProvider = require('./../../lib/clientProvider');

class MockMessage {
    constructor(){
        this.id = null;
        this.client = ClientProvider.instance();
    }

    edit (){

    }

    delete(){

    }
}

module.exports = MockMessage;