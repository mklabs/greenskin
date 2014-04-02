
var debug = require('debug')('server:index');

/*
 * GET home page.
 */

exports.index = function(req, res){
  debug('Index', req.url);
  res.render('index', { title: 'Express' });
};
