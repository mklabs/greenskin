
module.exports = function _graphite($http, graphiteUrl) {
  var graphite = {};

  graphite.metrics = function(builtOn, name) {
    return $http({
      url: graphiteUrl + 'metrics/find?query=greenskin.' + builtOn + '.' + name + '.*.*'
    });
  };

  graphite.render = function(target, from) {
    return $http({
      url: graphiteUrl + 'render?target=' + target + '&format=json' +
        (from ? '&from=' + from : '')
    });
  };

  return graphite;
};
