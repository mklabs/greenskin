let app = require('./lib/app');
let moment = require('moment');
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

greenskin.start = (opts) => {
  return greenskin.listen(opts)
    .then(() => {
      return greenskin.query()
        .then((jobs) => {
          jobs = jobs.filter((job) => {
            var now = moment();
            var nextRunAt = moment(Date.parse(job.nextRunAt));
            if (nextRunAt.isBefore(now)) {
              greenskin.agenda.every(job.repeatInterval, job.name);
            }
          });
        });
    });
};
