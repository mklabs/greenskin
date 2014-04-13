require('./phantomjs-nodify');
var Parser = require('./gherkin-parser');
var Gherkin = require('gherkin').Lexer('en');

var fs = require('fs');
var path = require('path');
require.stub('url', function() {});
require.stub('stream', function() { return { Stream: function() {} }});

var Mocha = require('mocha');
var mocha = new Mocha();

mocha.reporter('spec');
mocha.timeout(15000);

var nopt = require('nopt')({
	stepdir: path
});

var files = nopt.argv.remain;

var steps = [];

steps.push({
	keyword: 'Given',
    reg: /I browse URL "([^"]+)"/,
    handler: function(url, done) {
        var page = this.page = require('webpage').create();
        page.open(url, function(status) {
            if (status !== 'success') return done(new Error(status));
            done();
        });
    }
});

steps.push({
	keyword: 'Then',
    reg: /I want to render the page at "([^"]+)"/,
    handler: function(filename, done) {
    	console.log('render', filename);
        this.page.render(filename);
        done();
    }
});

// Process, scan files, translate into mocha suites
files = files.map(function(file) {
    var filename = file;
    var body = fs.read(file);
    
    var parser = new Parser(mocha.suite, file, steps);
    var lexer = new Gherkin(parser);
    lexer.scan(body);

    return {
        filename: filename,
        body: body,
        parser: parser
    };
});


var runner = mocha.run(function(code) {
    console.log('yep', code);
    process.exit(code);
});
