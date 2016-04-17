let app = require('./lib/app');
let greenskin = module.exports = app.greenskin;

greenskin.app      = app;
greenskin.agenda   = require('./lib/agenda');
greenskin.agendash = require('./lib/agendash');

greenskin.listen = (opts) => {
  return new Promise((r, errback) => {
    return greenskin.connect(opts.db)
      .catch(errback)
      .then(function() {
        return app.listen(opts.port, (err) => {
          if (err) return errback(err);
          r()
        });
      });
  });
};

