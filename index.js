let app = require('./lib/app');
let greenskin = module.exports = app.greenskin;

greenskin.listen = (opts) => {
  return new Promise((r, errback) => {
    greenskin.options = opts || {};
    greenskin.collection = opts.collection || 'jobs';

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

