
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
      url: './xml/mailer.xml'
    }).then(function(data) {
      return $http({
        url: jenkinsUrl + 'job/mailer/api/json'
      }).then(function() {}, function() {
        // job doesn't exist, create it
        return $http({
          method: 'POST',
          url: jenkinsUrl + 'createItem?name=mailer',
          data: data.data,
          headers: {
            'Content-Type': 'application/xml'
          }
        });
      });
    }).then(function(data) {
      return $http({
        url: './xml/mailer-daily.xml'
      });
    }).then(function(data) {
      return $http({
        url: jenkinsUrl + 'job/mailer-daily/api/json'
      }).then(function() {}, function() {
        // job doesn't exist, create it
        return $http({
          method: 'POST',
          url: jenkinsUrl + 'createItem?name=mailer-daily',
          data: data.data,
          headers: {
            'Content-Type': 'application/xml'
          }
        });
      });
    }).then(function() {
      return $http({
        url: './xml/mailer-weekly.xml'
      });
    }).then(function(data) {

      return $http({
        url: jenkinsUrl + 'job/mailer-weekly/api/json'
      }).then(function() {}, function() {
        // job doesn't exist, create it
        return $http({
          method: 'POST',
          url: jenkinsUrl + 'createItem?name=mailer-weekly',
          data: data.data,
          headers: {
            'Content-Type': 'application/xml'
          }
        });
      });
    }).then(function() {
      return $http({
        url: './xml/cleanup-workspace.xml'
      });
    }).then(function(data) {
      return $http({
        url: jenkinsUrl + 'job/cleanup-workspace/api/json'
      }).then(function() {}, function() {
        // job doesn't exist, create it
        return $http({
          method: 'POST',
          url: jenkinsUrl + 'createItem?name=cleanup-workspace',
          data: data.data,
          headers: {
            'Content-Type': 'application/xml'
          }
        });
      });
    }).then(function(data) {
      return $http({
        method: 'POST',
        url: jenkinsUrl + 'createItem?name=' + name,
        data: xml,
        headers: {
          'Content-Type': 'application/xml'
        }
      });
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
