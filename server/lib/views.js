
var debug = require('debug')('server:views');
var path  = require('path');
var View  = require('express/lib/view');

// Multiple views directory
var views = [path.join(__dirname, '../views')];

// Based off https://gist.github.com/naholyr/995474https://gist.github.com/naholyr/995474
//
// Thank you M. Naholyr
var old = View.prototype.lookup;
View.prototype.lookup = function lookup(view, root) {
  root = root || views;
  debug('Lookup', view, root);

  // Fallback to standard behavior, when root is a single directory
  if (!Array.isArray(root)) {
    return old.apply(this, arguments);
  }

  // If root is an array of paths, let's try each path until we find the view
  var options = this.options;
  var foundView = null;

  for (var i = 0, ln = root.length; i < ln; i++) {
    foundView = lookup.call(this, path.join(root[i], view), root[i]);
    if (foundView) break;
  }

  return foundView;
};

module.exports = function(app) {

  // Monkey patch hjs to impl. a basic layout system
  require('./hjs');
  app.set('view engine', 'hjs');

  debug('Setting views', views);
  app.set('views', views);

  // Subapp would need to call this to add one of their subdir to the view
  // system
  app.addViews = function addViews(path) {
    views.push(path);
    debug('Adding new path to views directories', path);
    app.set('views', views);
  };

};

