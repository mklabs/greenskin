var debug      = require('debug')('greenskin:api');
var phantomas  = require('phantomas');
var mongo      = require('mongodb');
var Agenda     = require('agenda');
var agendash   = require('agendash/lib/agendash');
var middleware = require('./agendash');

module.exports = class Greenskin {
  constructor() {
    this.db = null;
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
      this.agenda.database(url, this.collection);

      let next = () => {
        // And connect mongo driver
        mongo.connect(url, (err, db) => {
          if (err) return errback(err);
          this.db = db;
          r();
        });
      }

      if (this.agenda.started) return next();

      this.agenda.once('ready', () => {
        this.agenda.start();
        next();
      });

    });
  }

  create(items) {
    items = Array.isArray(items) ? items : [items];
    debug('Inserting documents', items);
    return new Promise((r, errback) => {
      this.db.collection(this.collection)
        .insertMany(items, (err, result) => {
          if (err) return errback(err);
          debug('Inserted %d documents', items.length);
          this.createAgenda(items);
          r(result);
        });
    });
  }

  query(params) {
    params = params || {};
    debug('Getting job', params);

    return new Promise((r, errback) => {
      if (!this.db) {
        return errback(new Error('No db instance, please use .connect()'));
      }

      var collection = this.db.collection(this.collection);

      params = params || {};
      collection.find(params).toArray((err, docs) => {
        if (err) return errback(err);
        debug('Found %d documents', docs.length);
        docs = docs.filter((doc) => doc.type);
        r(docs);
      });
    });
  }

  delete(id) {
    debug('Deleting job %s', id);
    return new Promise((r, errback) => {
      this.db
        .collection(this.collection)
        .deleteOne({ id: id }, (err, result) => {
          if (err) return errback(err);
          debug('Removed the document with id %s', id);
          callback(result);
        });
    });
  }

  createAgenda(items) {
    var item = items[0];
    item.config.urls = item.urls;
    item.config.frequency = item.frequency;

    debug('Creating agenda job for', item.name);
    this.agenda.define(item.name, this.job.bind(this));
    this.agenda.every(item.frequency, item.name, item.config);
  }

  job(job, done) {
    debug('Triggering phantomas job for %s with:', job.attrs.name);
    var urls = job.attrs.data.urls;
    if (!Array.isArray(urls)) return done(new Error('Invalid urls data'));

    var promises = urls.map((url) => {
      return this.phantomas(url, job.attrs.data);
    });

    Promise.all(promises)
      .then((results) => {
        var json = results.map((r) => r.json );

        debug('Done phantomas job %s with', job.attrs.name);
        job.attrs.lastRunResults = json;
        done(null, json);
      })
      .catch(done);
  }

  phantomas(url, options) {
    options = options || {};
    return phantomas(url, options);
  }
}
