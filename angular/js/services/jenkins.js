
module.exports = function _jenkins($http, jenkinsUrl) {
  var jenkins = {};

  jenkins.list = function list() {
    return $http({
      method: 'JSONP',
      url: jenkinsUrl + 'api/json?jsonp=JSON_CALLBACK'
    });
  };

  jenkins.job = function job(name) {
    return $http({
      method: 'JSONP',
      url: jenkinsUrl + 'job/' + name + '/api/json?jsonp=JSON_CALLBACK'
    });
  };

  jenkins.build = function build(name, build) {
    return $http({
      method: 'JSONP',
      url: jenkinsUrl + 'job/' + name + '/' + build + '/api/json?jsonp=JSON_CALLBACK'
    });
  };

  jenkins.config = function config(name) {
    return $http({
      url: jenkinsUrl + 'job/' + name + '/config.xml'
    });
  };

  jenkins.postConfig = function config(name, xml) {
    return $http({
      method: 'POST',
      url: jenkinsUrl + 'job/' + name + '/config.xml',
      data: xml
    });
  };

  jenkins.phantomasConfig = function phantomasConfig() {
    return $http({
      url: './xml/phantomas.xml'
    });
  };

  jenkins.createItem = function createItem(name, xml) {
    return $http({
      method: 'POST',
      url: jenkinsUrl + 'createItem?name=' + name,
      data: xml,
      headers: {
        'Content-Type': 'application/xml'
      }
    });
  };

  jenkins.deleteJob = function deleteJob(name) {
    return $http({
      method: 'POST',
      url: jenkinsUrl + 'job/' + name + '/doDelete'
    });
  };

  return jenkins;
};
