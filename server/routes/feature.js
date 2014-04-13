var debug = require('debug')('server:feature');

var express = require('express');
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var config = require('../package.json').config;

// Phantomjs script
var phantomjs = require('phantomjs').path;
var mochaRunner = path.join(__dirname, '../test/mocha-test.js');

module.exports = function(app) {
    var featuredir = path.join(__dirname, '../test/features');
    
    var ws = app.ws;
    app.get(/^\/feature\/(.+)\/?$/, function(req, res, next) {
        var filename = req.url.replace(/^\/feature\//, '');
        if (!filename) return next(new Error('Error getting feature file. No filename param.'));

        var data = {};
        data.title = 'Edit feature ' + filename;
        data.filename = filename;
        console.log(data.filename);
        fs.readFile(path.join(featuredir, filename), 'utf8', function(err, body) {
            if (err) return next();
            data.body = body;
            data.runAction = '/run-feature/' + filename;
            data.saveAction = '/feature/' + filename;
            res.render('feature', data);
        });
    });

    // Save
    app.post(/^\/feature\/(.+)\/?$/, function(req, res, next) {
        var filename = req.url.replace(/^\/feature\//, '');
        var params = req.body;
        var content = params.code;

        fs.writeFile(path.join(featuredir, filename), content, function(err) {
            if (err) return next(err);
            res.json({ ok: true });
        });
    });

    // Run
    app.get(/^\/run-feature\/(.+)\/?$/, function(req, res, next) {
        var filename = req.url.replace(/^\/run-feature\//, '');
        
        
        var args = [mochaRunner, path.join(featuredir, filename)]
        
        console.log('spawn phantomjs', args);
        var phantom = spawn(phantomjs, args);
        
        phantom.stdout.pipe(process.stdout);
        phantom.stderr.pipe(process.stderr);
        
        phantom.stdout.on('data', function(data) {
            data = data + '';
            ws.sockets.emit('log', { line: data });
        });
        
        phantom.on('exit', function(code) {
            if (code !== 0) return next(new Error('Error spawning phantomjs'))
            res.json({ code: code });
        
        });

    });

    app.use('/feature', express.directory(featuredir));
    // app.get('/feature', feature.index);
};