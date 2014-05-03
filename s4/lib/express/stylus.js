
var fs     = require('fs');
var path   = require('path');
var stylus = require('stylus');
var nib    = require('nib');
var debug  = require('debug')('gs:stylus');

// module.exports = middleware;
module.exports = middleware;
middleware.compile = compile;

function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .set('compress', true)
    .use(nib())
    .import('nib');
}

function middleware(options) {
  options = options || {};
  options.src = options.src || process.cwd();
  return function(req, res, next) {
    var file = req.url.slice(1);

    var filename = path.join(options.src, file);
    if (path.extname(filename) === '.css') filename = filename.replace(/\.css$/, '.styl');

    debug('Getting %s', filename);
    fs.readFile(filename, 'utf8', function(err, body) {
      if (err) return next(err);
      debug('Response %s', filename, body.length);
      var styl = compile(body, filename);
      styl.render(function(err, css) {
        if (err) return next(err);
        debug('Compiled: ', css.length);
        res.type('css');
        res.send(new Buffer(css));
      });
    });
  };
}

function stylusMiddleware(options) {
  options = options || {};
  return stylus.middleware({
    src: options.src || path.join(__dirname, '../public'),
    dest: options.dest || path.join(__dirname, '../public/compiled'),
    compile: compile
  });
}
