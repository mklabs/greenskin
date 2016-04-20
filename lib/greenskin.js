var Url        = require('url');
var debug      = require('debug')('greenskin:api');
var moment     = require('moment');
var path       = require('path');
var phantomas  = require('phantomas');
var Agenda     = require('agenda');
var agendash   = require('agendash/lib/agendash');
var middleware = require('./agendash');
var ObjectId   = require('mongodb').ObjectId

module.exports = class Greenskin {
  constructor() {
    this.collection = 'jobs';

    this.agenda = new Agenda();
    this.agendash = middleware(agendash(this.agenda));
    this.agenda.once('ready', () => {
      this.agenda.start();
      this.agenda.started = true;
    });
  }

  connect(url) {
    return new Promise((r, errback) => {
      if (!url) return errback(new Error('Missing db url'));

      debug('Connecting to %s', url);

      // Init agenda
      this.agenda.database(url, 'agendaJobs');

      if (this.agenda.started) return r();

      this.agenda.once('ready', () => {
        this.agenda.start();
        r();
      });
    });
  }

  create(item) {
    debug('Inserting document', item);

    return new Promise((r, errback) => {
      this.createAgenda(item);
      return r();
    });
  }

  query(params) {
    params = params || {};
    debug('Getting job', params);

    return new Promise((r, errback) => {

      this.agenda.jobs(params, (err, jobs) => {
        if (err) return errback(err);
        debug('Found %d documents', jobs.length);

        jobs = jobs.map((job) => {
          job.attrs.href = encodeURIComponent(job.attrs.name);
          return job.attrs;
        });

        r(jobs);
      });
    });
  }

  delete(ids) {
    ids = Array.isArray(ids) ? ids : [ids];

    debug('Deleting jobs %s', ids.join(' '));

    let ins = ids.map((id) => new ObjectId(id));
    let query = { _id: { $in: ins } };

    return new Promise((r, errback) => {
      agenda.cancel(query, function (err, deleted) {
        if (err) return errback(err);
        if (!deleted) return errback(new Error('Job ' + id + ' not deleted'));
        debug('Removed the documents with id %s', ins.join(' '));
        r();
      });
    });
  }

  createAgenda(item) {
    debug('Creating agenda job for', item, item.name);
    item = item || {};
    item.data = item.data || item.config || {};
    this.agenda.define(item.name, this.job.bind(this));
    this.agenda.every(item.frequency, item.name, item.data);
  }

  job(job, done) {
    debug('Triggering phantomas job for %s with:', job.attrs.name);
    var urls = job.attrs.data.urls;
    if (!Array.isArray(urls)) return done(new Error('Invalid urls data'));

    var pattern = 'YYYY/YYMMDD-X';
    job.attrs.filmstripDate = moment().format(pattern);

    var basedir = path.join('/jobs', job.attrs.name, job.attrs.filmstripDate);

    var promises = urls.map((url) => {
      var urldir = Url.parse(url).host + Url.parse(url).pathname;
      return this.phantomas(url, job.attrs.data, job, path.join(basedir, urldir));
    });

    Promise.all(promises)
      .then((results) => {
        var json = results.map((r) => {
          var urldir = Url.parse(r.json.url).host + Url.parse(r.json.url).pathname;
          r.json.filmstripdir = path.join(basedir, urldir);
          console.log('set filmdir', r.json.filmstripdir);
          return r.json;
        });

        debug('Done phantomas job %s with', job.attrs.name);
        job.attrs.lastRunResults = json;
        done(null, json);
      })
      .catch(done);
  }

  phantomas(url, options, job, filmdir) {
    options = options || {};
    var date = job.attrs.filmstripDate || Date.now();
    var filmdir = path.join(__dirname, 'app/public', filmdir);

    Object.assign(options, {
      'film-strip': true,
      'film-strip-dir': filmdir
    });

    debug('Phantomas run %s with options', url);
    return phantomas(url, options);
  }
}
