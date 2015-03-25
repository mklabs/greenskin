
module.exports = function listController($scope, $http, $location, jenkins, ignoredJobs, jenkinsUrl) {
  $scope.jenkinsUrl = jenkinsUrl;

  $scope.createJob = function createJob() {
    $location.path('/new');
  };

  $scope.deleteJob = function deleteJob(name) {
    if (!confirm('Are you sure ?')) return;

    jenkins.deleteJob(name).success(function() {
      $scope.jobs = $scope.jobs.filter(function(job) {
        return job.name !== name;
      });
    }).error(function(msg) {
      alert(msg);
    });

  };

  jenkins.list().success(function(data) {
    $scope.jobs = data.jobs.filter(function(job) {
      return ignoredJobs.filter(function(ignored) {
        return job.name.indexOf(ignored) !== -1;
      }).length === 0;
    }).map(function(job) {
      if (job.color === 'notbuilt') job.color = 'nobuilt';
      return job;
    });
  });
};
