var app = require('..');

module.exports = function(req, res, next) {
  var params = req.body;

  var job = new app.gs.Job(req.params);

  console.log('save', params);
  next();

};
