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
	stepdir: String
});

var files = nopt.argv.remain;

var steps = [];

var stepfiles = [];

global.Given = function Given(reg, handler) {
    reg = typeof reg === 'string' ? new RegExp('^' + reg + '$') : reg;
    steps.push({
    	keyword: 'Given',
        reg: reg,
        handler: handler
    });
};

global.When = function When(reg, handler) {
    reg = typeof reg === 'string' ? new RegExp('^' + reg + '$') : reg;
    steps.push({
    	keyword: 'When',
        reg: reg,
        handler: handler
    });
};

global.Then = function Then(reg, handler) {
    reg = typeof reg === 'string' ? new RegExp('^' + reg + '$') : reg;
    steps.push({
    	keyword: 'Then',
        reg: reg,
        handler: handler
    });
};

if (nopt.stepdir) {
	stepfiles = fs.list(nopt.stepdir).filter(function(file) {
        if (file === '.') return false;
        if (file === '..') return false;
        return fs.isFile(path.join(nopt.stepdir, file));
    }).map(function(file) {
        return path.join(nopt.stepdir, file);
    });
    
    stepfiles.forEach(function(file) {
        file = fs.isAbsolute(file) ? file : path.join(fs.workingDirectory, file);
        require(file);
    });
}


/* * /
/* */

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
