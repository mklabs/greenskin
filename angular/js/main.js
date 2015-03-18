
window.jQuery = window.$ = require('jquery');

require('jquery.flot');
require('jquery.flot.time');
require('jquery.cron');

require('angular');
require('angular-route');
require('angular-flot');

angular.module('gs', [ 'ngRoute', 'angular-flot' ] )

  // Config
  .constant('jenkinsUrl', 'http://dc1-se-prod-kkspeed-01.prod.dc1.kelkoo.net:8080/')
  .constant('graphiteUrl', 'http://dc1-se-prod-perf-01.prod.dc1.kelkoo.net:8000/')
  .constant('ignoredJobs', ['mailer', 'witbe', 'cleanup', 'Travel', 'statsd', 'webdriver_kill', 'webpagetest'])

  // Routes
  .config(['$routeProvider', require('./routes')])

  // Services
  .factory('jenkins', require('./services/jenkins'))
  .factory('graphite', require('./services/graphite'))

  // Controllers
  .controller('ListController', require('./controllers/list'))
  .controller('JobController', require('./controllers/job'))
  .controller('JobCreationController', require('./controllers/job-creation'));
