
// Routes definition

module.exports = function routes($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'js/templates/list.html',
      controller: 'ListController'
    })
    .when('/job/:name', {
      templateUrl: 'js/templates/job.html',
      controller: 'JobController',
      reloadOnSearch: false
    })
    .when('/new', {
      templateUrl: 'js/templates/new.html',
      controller: 'JobCreationController'
    })
    .otherwise({
      redirectTo: '/'
  });
};
