/**
 * Mocha tests expect to be run from the mocha cli, making debugging difficult if your debugger wants to run tests
 * directly from node. This file is a workaround for that - you can debug this file directly, it will in turn fire up
 * mocha and run all tests in the ./tests folder.
 *
 * Confirmed working in Webstorm, also with breakpoints in any test file or any server file hidden behind the API.
 */

let Mocha = require('mocha'),
    glob = require('glob'),
    tests = glob.sync('./tests/**/*.js'),
    process = require('process'),
    mocha = new Mocha({});

// set environment flag so bot knows we're running from test, this is needed to fix pathing etc
process.env['isTesting'] = 1;

// TIP. Want to debug just one file? Overwrite tests array variable with your one file like :
// tests = [__dirname + '/tests/commands/status.js'];

for (let i = 0 ; i < tests.length ; i ++){
    // slice removes .js file extension, which mocha doesn't want
    mocha.addFile(tests[i].slice(0, -3));
}

mocha.run()
    .on('test', function(test) {
        console.log('Test started: ' + test.title);
    })
    .on('test end', function(test) {
        console.log('Test ended: ' + test.title);
    })
    .on('pass', function(test) {
        console.log('Test passed');
    })
    .on('fail', function(test, err) {
        console.log('Test failed');
        console.log(test);
        console.log(err);
    })
    .on('end', function() {
        console.log('All tests done');
    });
