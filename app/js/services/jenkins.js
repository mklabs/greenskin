
module.exports = function _jenkins($http, jenkinsUrl, mails, mailUser, mailPassword, mailHost, mailFrom) {
  var jenkins = {};

  jenkins.list = function list() {
    return $http({
      url: jenkinsUrl + 'api/json'
    });
  };

  jenkins.job = function job(name) {
    return $http({
      url: jenkinsUrl + 'job/' + name + '/api/json'
    });
  };

  jenkins.build = function build(name, build) {
    return $http({
      url: jenkinsUrl + 'job/' + name + '/' + build + '/api/json'
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

  function getXmlTemplate(job) {
    // Get template
    return $http({
      url: './xml/' + job + '.xml'
    }).then(function(data) {
      // Check if job exists
      return $http({
        url: jenkinsUrl + 'job/' + job + '/api/json'
      }).then(function() {}, function() {
        // job doesn't exist, create it


        // Replace config variables
        var xml = $($.parseXML(data.data));

        xml.find('name:contains(JOB_MAILS)').next().next().text(mails.join(' '));
        xml.find('name:contains(MAIL_USER)').next().next().text(mailUser);
        xml.find('name:contains(MAIL_PASSWORD)').next().next().text(mailPassword);
        xml.find('name:contains(MAIL_HOST)').next().next().text(mailHost);
        xml.find('name:contains(MAIL_FROM)').next().next().text(mailFrom);

        var xmlString = (new XMLSerializer()).serializeToString(xml[0]);

        return $http({
          method: 'POST',
          url: jenkinsUrl + 'createItem?name=' + job,
          data: xmlString,
          headers: {
            'Content-Type': 'application/xml'
          }
        });
      });
    });
  }

  jenkins.createItem = function createItem(name, xml) {
    return getXmlTemplate('mailer')
      .then(getXmlTemplate('mailer-daily'))
      .then(getXmlTemplate('mailer-weekly'))
      .then(getXmlTemplate('cleanup-workspace'))
      .then(function(data) {
        console.log('Finally, create job', name, data);
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
