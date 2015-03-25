
module.exports = function JobCreationController($scope, $location, jenkins, graphiteUrl) {

  $scope.name = '';
  $scope.type = 'phantomas';

  var urls = $scope.urls = ['http://example.com'];
  $scope.url = '';
  $scope.cron = '';

  var values = {};
  ['5', '10', '15', '20', '30', '45'].forEach(function(value) {
    values[value + ' Minutes'] = '*/' + value + ' * * * *';
  });

  angular.element('.js-cron').cron({
    initial: '* * * * *',
    customValues: values,
    onChange: function onChange() {
      var val = angular.element(this).cron('value');
      $scope.cron = val;
      $scope.$apply();
    }
  });

  var xml;
  jenkins.phantomasConfig().success(function(data) {
    xml = $($.parseXML(data));
    var config = JSON.parse(xml.find('name:contains(JSON_CONFIG)').next().next().text());
    $scope.json = JSON.stringify(config, null, 2);
  });

  $scope.addUrl = function addUrl(e) {
    e.preventDefault();
    if (!$scope.url) return;
    urls.push($scope.url);
  };

  $scope.editUrl = function editUrl(e) {
    e.preventDefault();

    var tr = angular.element(e.target).closest('tr');
    tr.find('.js-link').addClass('is-hidden');
    tr.find('.js-input').removeClass('is-hidden');
  };

  $scope.removeUrl = function removeUrl(e, index) {
    e.preventDefault();
    urls.splice(index, 1);
  };

  $scope.hideInput = function hideInput(e) {
    var tr = angular.element(e.target).closest('tr');
    tr.find('.js-link').removeClass('is-hidden');
    tr.find('.js-input').addClass('is-hidden');
  };

  $scope.submit = function submit(e) {
    e.preventDefault();

    var json = $scope.json;

    var data;
    try {
      data = JSON.parse(json);
    } catch(e) {
      alert('Error: Invalid JSON format');
      return;
    }

    // set urls
    xml.find('name:contains(PERF_URLS)').next().next().text($scope.urls.join(' '));

    // set json config
    xml.find('name:contains(JSON_CONFIG)').next().next().text(JSON.stringify(data));

    // set graphite host
    xml.find('name:contains(GRAPHITE_HOST)').next().next().text(graphiteUrl);

    // set frequency
    xml.find('triggers spec').text($scope.cron);

    var xmlString = (new XMLSerializer()).serializeToString(xml[0]);

    jenkins.createItem($scope.name, xmlString).then(function() {
      console.log('saved!', arguments);
      alert('Saved.');
      $location.path('/');
    }).error(function() {
      alert('Error trying to save config.');
    });

  };

};
