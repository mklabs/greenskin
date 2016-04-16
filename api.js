var debug = require('debug')('greenskin:api');
var mongo = require('mongodb');

module.exports = Api;

function Api(url) {
  this.url = url;
  this.db = null;
  this.collectionName = 'jobs';
}

Api.prototype.connect = (done) => {
  var url = this.url;

  debug('Connecting to %s', url);
  return new Promise((r, errback) => {
    mongo.connect(url, (err, db) => {
      if (err) return errback(err);
      this.db = db;
      r();
    });
  });
}

Api.prototype.delete = (id) => {
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
}

Api.prototype.create = (items) => {
  items = Array.isArray(item) ? item : [item];
  return new Promise((r, errback) => {
    this.db.collection(this.collectionName)
      .insertMany(items, function(err, result) {
        if (err) return errback(err);
        debug('Inserted %d documents', item.length);
        r(result);
      });
  });
}

Api.prototype.job = (id) => {
  debug('Getting job %s', id);
  return new Promise((r, errback) => {
    if (!this.db) {
      return errback(new Error('No db instance, please use .connect()'));
    }

    var collection = this.db.collection(this.collectionName);

    collection.find({}).toArray((err, docs) => {
      if (err) return errback(err);
      debug('Found the following records:');
      debug(docs);
      r(docs);
    });
  });
}
