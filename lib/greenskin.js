var debug = require('debug')('greenskin:api');
var mongo = require('mongodb');
var app   = require('./server');

module.exports = Greenskin;

function Greenskin(url) {
  this.url = url;
  this.db = null;
  this.collectionName = 'jobs';
}

Greenskin.prototype.connect = (done) => {
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

Greenskin.prototype.delete = (id) => {
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

Greenskin.prototype.create = (items) => {
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

Greenskin.prototype.job = (id) => {
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

Greenskin.prototype.listen = (port) => {
  return new Promise((r, errback) => {
    app.listen(port, (err) => {
      if (err) return errback(err);
      r()
    });
  });
}
