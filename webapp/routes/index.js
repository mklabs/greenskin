
/*
 * GET home page.
 */

exports.index = function(req, res){

  var metric = {};
  metric.title = 'load avg';

  res.render('index', {
    title: 'Express Perfite',
    metric: metric
  });
};
