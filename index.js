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
  return new Promise((r, errback) => {
    var now = tz();
    var item = job.attrs;
    if (job.attrs.repeatTimezone) now = now.tz(job.attrs.repeatTimezone);

    var nextRunAt = tz(job.attrs.nextRunAt).valueOf();

    if (item.repeatInterval) item.frequency = item.repeatInterval;

    if (nextRunAt > now.valueOf()) {
      debug('Recover job %s', item.name, item);
      greenskin.createAgenda(item);
      return r();
    }

    job.attrs.nextRunAt = new Date(now.valueOf() + humanInterval(job.attrs.repeatInterval));
    job.attrs.lockedAt = null;
    debug('Update nextRunAt to be on', job.attrs.nextRunAt);

    job.save((err) => {
      if (err) return errback(err);
      debug('Saved agenda job to db', job.name, job.nextRunAt, job.attrs.data);
      greenskin.createAgenda(item);
      r();
    });
  });
};
