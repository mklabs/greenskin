var debug = require('debug')('greenskin:api');
var mongo = require('mongodb');

module.exports = Greenskin;

function Greenskin(url) {
  this.url = url;
  this.db = null;
  this.collectionName = 'jobs';
}

Greenskin.prototype.connect = function(url) {
  url = url || this.url;
  debug('Connecting to %s', url);
  return new Promise((r, errback) => {
    mongo.connect(url, (err, db) => {
      if (err) return errback(err);
      this.db = db;
      r();
    });
  });
};

Greenskin.prototype.delete = function(id) {
  debug('Deleting job %s', id);
  return new Promise((r, errback) => {
    this.db
      .collection(this.collectionName)
      .deleteOne({ id: id }, (err, result) => {
        if (err) return errback(err);
        debug('Removed the document with id %s', id);
        callback(result);
      });
  });
};

Greenskin.prototype.create = function(items) {
  items = Array.isArray(items) ? items : [items];
  debug('Inserting documents', items);
  return new Promise((r, errback) => {
    this.db.collection(this.collectionName)
      .insertMany(items, function(err, result) {
        if (err) return errback(err);
        debug('Inserted %d documents', items.length);
        r(result);
      });
  });
};

Greenskin.prototype.job = function(query) {
  query = query || {};
  debug('Getting job %s', query);

  return new Promise((r, errback) => {
    if (!this.db) {
      return errback(new Error('No db instance, please use .connect()'));
    }

    var collection = this.db.collection(this.collectionName);

    query = query || {};
    collection.find(query).toArray((err, docs) => {
      if (err) return errback(err);
      debug('Found %d documents', docs.length);
      r(docs);
    });
  });
};
