
window.jQuery = window.$ = require('jquery');

require('jquery.flot');
require('jquery.flot.time');
require('jquery.cron');

require('angular');
require('angular-route');
require('angular-flot');

angular.module('gs', [ 'ngRoute', 'angular-flot' ] )

  .constant('baseUrl', '/greenskin')

  // Config
  .constant('jenkinsUrl', 'http://192.168.33.12/jenkins/')
  .constant('graphiteUrl', 'http://192.168.33.11/')
  .constant('graphiteHost', '192.168.33.11')

  // Use this to filter out jobs from jenkins you don't want to display in Jenkins
  .constant('ignoredJobs', ['mailer', 'witbe', 'cleanup', 'Travel', 'statsd', 'webdriver_kill', 'webpagetest'])

  // Use this to configure mailing jobs to send emails to the following
  // email address
  .constant('mails', ['example@example.com'])

  // Mail SMTP user authentification
  .constant('mailUser', 'example@example.com')

  // Mail SMTP password for the user
  .constant('mailPassword', '')

  // Mail SMTP hostname
  .constant('mailHost', 'smtp.example.com')

  // Mail from options when sending emails
  .constant('mailFrom', 'example@example.com')

  // Routes
  .config(['$routeProvider', require('./routes')])

  // Services
  .factory('jenkins', require('./services/jenkins'))
  .factory('graphite', require('./services/graphite'))

  // Controllers
  .controller('ListController', require('./controllers/list'))
  .controller('JobController', require('./controllers/job'))
  .controller('JobCreationController', require('./controllers/job-creation'))

  .run(function($rootScope, baseUrl) {
    $rootScope.baseUrl = baseUrl;
  });
