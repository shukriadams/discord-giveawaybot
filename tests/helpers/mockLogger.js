class WinstonMock {
    info(content){
        console.log('Mocklogger received info : ', content)
    }

    error(content){
        console.log('Mocklogger received error : ', content)
    }
}

module.exports = class MockLogger {

    constructor(){
        this.info = new WinstonMock();
        this.error = new WinstonMock();
    }

};

