
module.exports = function listController($scope, $http, $location, jenkins, ignoredJobs, jenkinsUrl) {
  $scope.jenkinsUrl = jenkinsUrl;

  $scope.createJob = function createJob() {
    console.log('job', arguments);
    $location.path('/new');
  };

  jenkins.list().success(function(data) {
    $scope.jobs = data.jobs.filter(function(job) {
      return ignoredJobs.filter(function(ignored) {
        return job.name.indexOf(ignored) !== -1;
      }).length === 0;
    });
  });
};
