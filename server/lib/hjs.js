
var hjs = require('hjs');
var fs = require('fs');
var path = require('path');

module.exports = hjs;

var __express = hjs.__express;
hjs.__express = function(name, options, fn) {
	var layout = options._layout || 'layout';
	__express(name, options, function(err, body) {
		if (err) return fn(err);
		fs.readFile(path.join(__dirname, '../views', layout + '.hjs'), 'utf8', function(err, layout) {
			if (err) return fn(err);
			var tpl = hjs.compile(layout);
			options.yield = body;
			return fn(null, tpl.render(options));
		});
	});
};