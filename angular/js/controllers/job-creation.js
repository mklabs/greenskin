
module.exports = function JobCreationController($scope) {

  var job = $scope.job = {};
  job.type = 'phantomas';

  // $scope.$on('$destroy', this.destroy.bind(this));

  // TODO: Should wrap this into a directive
  angular.element('.js-cron').cron();

};
