var debug = require('debug')('greenskin:routes');

module.exports = class Router {

  get routes() {
    return {};
  }

  constructor(api, app) {
    this.api = api;
    this.app = app;
    if (!this.app) throw new Error('Missing app property');

    this.registerRoutes();
  }

  registerRoutes() {
    var routes = this.routes;

    Object.keys(routes).forEach((path) => {
      var method = routes[path];

      var parts = path.split(' ');
      var verb = parts[1] ? parts[0] : 'get';
      path = parts[1] || parts[0];

      verb = verb.toLowerCase();
      debug('Register %s %s', verb.toUpperCase(), path);
      this.app[verb](path, this[method].bind(this));
    });
  }
}
