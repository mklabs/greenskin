var debug = require('debug')('server:pool-queue');

var jenkins = require('./jenkins');


module.exports = function(app) {

  var ws = app.ws;

  function requestQueue(done) {
    jenkins.queue.get(function(err, data) {
      if (err) return done(err);
      done(null, data);
    });
  }

  var actives = [];
  (function next() {
    debug('Pooling queue');

    setTimeout(function() {
      requestQueue(function(err, data) {
        if (err) debug('Queue err', err);
        debug('Queue', data);

        var items = data.items || [];
        var ids = items.map(function(q) {
          return q.id;
        });

        var removed = actives.filter(function (queue) {
          return !~ids.indexOf(queue.id); 
        });

        removed.forEach(function(q) {
          ws.sockets.emit('queue.remove', q);
        });

        actives = [];
        items.forEach(function(queue) {
          debug('emit queue', queue);
          actives.push(queue);
          ws.sockets.emit('queue', queue);
        });

        next();
      });
    }, 2000);

  })();


};