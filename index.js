let app = require('./lib/app');
let moment = require('moment');
let tz = require('moment-timezone');
let humanInterval = require('human-interval');

let debug = require('debug')('greenskin');

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
  return greenskin.listen(opts).then(() => {
    return new Promise((r, errback) => {
      greenskin.agenda.jobs({}, (err, jobs) => {
        if (err) return errback(err);

        jobs = jobs.filter((job) => {
          var now = moment();
          var nextRunAt = moment(Date.parse(job.attrs.nextRunAt));
          return nextRunAt.isBefore(now) && job.attrs.type === 'single';
        });

        if (!jobs.length) return r();

        return greenskin.recover(jobs)
          .catch(errback)
          .then(r);
      })
    });
  });
};

greenskin.recover = (jobs) => {
  var promises = jobs.map(greenskin.recoverJob);
  debug('Recover %d jobs', jobs.length);
  return Promise.all(promises);
};

greenskin.recoverJob = (job) => {
  debug('Should recover job', job.attrs.name);

  return new Promise((r, errback) => {
    var nextRunAt = new Date(job.attrs.nextRunAt).getTime();
    var lastRun = tz();
    if (job.attrs.repeatTimezone) lastRun = d.tz(job.attrs.repeatTimezone);

    job.attrs.nextRunAt = lastRun.valueOf() + humanInterval(job.attrs.repeatInterval);
    job.save((err) => {
      if (err) return errback(err);
      debug('Updated %s job. Next run: %s', job.attrs.name, moment(job.attrs.nextRunAt).format('LLLL'));
      r();
    });
  });
};
