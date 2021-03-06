
function JobController($scope, $routeParams, $location, jenkins, graphite, graphiteUrl) {

  this.scope = $scope;
  this.params = $routeParams;
  this.location = $location;
  this.jenkins = jenkins;
  this.graphite = graphite;
  this.graphiteUrl = graphiteUrl;

  $scope.from = $routeParams.from ? $routeParams.from : '-7d';

  $scope.$on('$destroy', this.destroy.bind(this));
  $scope.$watch('from', this.fromChanged.bind(this));

  this.interval = setInterval(this.loop.bind(this), 1000 * 30);

  this.scope.showAsserts = false;
  this.scope.showUrls = false;
  this.scope.showFrequency = false;

  this.scope.toogleAsserts = this.toogleAsserts.bind(this);
  this.scope.toogleUrls = this.toogleUrls.bind(this);
  this.scope.toogleFrequency = this.toogleFrequency.bind(this);

  this.scope.saveConfig = this.saveConfig.bind(this);
  this.scope.saveUrls = this.saveUrls.bind(this);
  this.scope.saveFrequency = this.saveFrequency.bind(this);

  this.fetch();
};

module.exports = JobController;

JobController.prototype.destroy = function destroy() {
  clearInterval(this.interval);
};

JobController.prototype.loop = function loop() {
  this.fetch(true);
};

JobController.prototype.saveConfig = function saveConfig() {
  var asserts = this.scope.asserts;
  if (!this.configDocument) return;
  var doc = this.configDocument;

  var data;

  try {
    data = JSON.parse(asserts);
  } catch(e) {
    alert('Error: Invalid JSON format');
    return;
  }

  $(doc).find('name:contains(JSON_CONFIG)').next().next()
    .text(JSON.stringify(data));

  var xml = (new XMLSerializer()).serializeToString(doc);

  this.jenkins.postConfig(this.params.name, xml).success(function() {
    alert('Saved.');
    this.scope.showAsserts = false;
    this.fetch();

  }.bind(this)).error(function() {
    alert('Error trying to save config.');
  });
};

JobController.prototype.saveUrls = function saveUrls() {
  if (!this.configDocument) return;
  var doc = this.configDocument;

  $(doc).find('name:contains(PERF_URLS)').next().next().text(this.scope.urls);

  var xml = (new XMLSerializer()).serializeToString(doc);

  this.jenkins.postConfig(this.params.name, xml).success(function() {
    alert('Saved.');
    this.scope.showUrls = false;
  }.bind(this)).error(function() {
    alert('Error trying to save config.');
  });
};

JobController.prototype.saveFrequency = function saveFrequency() {
  if (!this.configDocument) return;
  var doc = this.configDocument;

  $(doc).find('triggers spec').text(this.scope.cron);

  var xml = (new XMLSerializer()).serializeToString(doc);

  this.jenkins.postConfig(this.params.name, xml).success(function() {
    alert('Saved.');
    this.scope.showFrequency = false;
  }.bind(this)).error(function() {
    alert('Error trying to save config.');
  });
};

JobController.prototype.toogleAsserts = function toogleAsserts() {
  this.scope.showAsserts = !this.scope.showAsserts;
};

JobController.prototype.toogleUrls = function toogleUrls() {
  this.scope.showUrls = !this.scope.showUrls;
};

JobController.prototype.toogleFrequency = function toogleFrequency() {
  this.scope.showFrequency = !this.scope.showFrequency;
};

JobController.prototype.fetch = function fetch(loop) {
  this.jenkins.job(this.params.name).success(this.jobSuccess.bind(this));

  if (loop) return;

  this.jenkins.config(this.params.name).success(function(xml) {
    var doc = this.configDocument = $.parseXML(xml);

    var asserts = JSON.parse($(doc).find('name:contains(JSON_CONFIG)').next().next().text());
    this.scope.asserts = JSON.stringify(asserts, null, 2);

    this.scope.urls = $(doc).find('name:contains(PERF_URLS)').next().next().text();

    // bind cron widget (TODO: directive)
    this.scope.cron = $(doc).find('triggers spec').text();

    var values = {};
    ['5', '10', '15', '20', '30', '45'].forEach(function(value) {
      values[value + ' Minutes'] = '*/' + value + ' * * * *';
    });

    var $scope = this.scope;
    angular.element('.js-cron').cron({
      initial: this.scope.cron,
      customValues: values,
      onChange: function onChange() {
        var val = angular.element(this).cron('value');
        $scope.cron = val;
        $scope.$apply();
      }
    });
  }.bind(this));
};


JobController.prototype.fromChanged = function fromChanged(val, previous) {
  if (val === previous) return;
  this.location.search('from', val);

  this.buildFlotData();
};


JobController.prototype.jobSuccess = function jobSuccess(data) {
  this.scope.job = data;

  var params = data.actions[0].parameterDefinitions;
  var jsonConfig = params.filter(function(param) {
    return param.name === 'JSON_CONFIG';
  }).map(function(param) {
    return JSON.parse(param.defaultParameterValue.value);
  })[0];

  var asserts = jsonConfig.asserts;

  this.jenkins.build(data.name, data.lastBuild.number)
    .success(this.buildSuccess.bind(this, asserts));

};

JobController.prototype.buildSuccess = function buildSuccess(asserts, data) {
  var scope = this.scope;

  this.scope.build = data;

  this.graphite.metrics(data.builtOn, this.scope.job.name).success(function(metrics) {

    // Build metrics object
    scope.metrics = metrics.map(function(metric, i, arr) {
      var assert = asserts[metric.text];
      var from = '-7d';

      var options = !assert ? {
        legend: {
          position: 'nw'
        },
        xaxis: {
          mode: 'time',
          timezone: 'browser'
        }
      } : {
        legend: {
          position: 'nw'
        },
        grid: {
          markings: [
            { color: 'red', lineWidth: 2, yaxis: { from: assert, to: assert } },
          ]
        },

        xaxis: {
          mode: 'time',
          timezone: 'browser'
        }
      };

      return {
        target: metric.text,
        id: metric.id,
        assert: assert,
        url: this.graphiteUrl + 'render?target=' + metric.id + '&lineMode=connected' +
          (assert ? '&target=constantLine(' + assert + ')' : '' ) +
          '&height=600&width=800&fgcolor=black&bgcolor=white&fontSize=14' +
          (from ? '&from=' + from : ''),
        chartOptions: options
      }
    }, this).sort(function(a, b) {
      if (a.assert) return -1;
      return 1;
    });


    this.buildFlotData(asserts);
  }.bind(this));
};


JobController.prototype.buildFlotData = function buildFlotData(asserts) {
  asserts = asserts || {};

  var scope = this.scope;

  this.scope.metrics.forEach(function(metric) {
    var assert = asserts[metric.target];

    this.graphite.render(metric.id, this.scope.from)
      .success(function(targets) {
        if (!targets.length) return;
        var datapoints = targets[0].datapoints;
        var xzero = datapoints[0][1];

        var datas = targets.map(function(target, index) {
          var data = $.map(target.datapoints, function(value) {
            if (value[0] === null) return null;
            // hack of $.map will flat array object
            return [[ value[1] * 1000, value[0] ]];
          });

          // replace null value with previous item value
          for (var i = 0; i < data.length; i++) {
            if (i > 0 && data[i] === null) data[i] = data[-i];
          }

          if (!data.length) return;

          var last = data[data.length-1][1];

          // calculate color to render
          var color = null;
          if (assert) {
            if (last != null) {
              if (last >= assert) {
                color = 'rgba(' + (255 - (index * 10)) + ', ' + (0 + (index * 80)) + ', 0, 1)';
              } else {
                color = 'rgba(186, ' + (218 - (index * 50)) + ', 85, 1)';
              }
            }
          }

          return {
            color: color,
            data: data,
            label: target.target
          };
        }).filter(function(data) {
          return data;
        });

        metric.data = datas;
      });

  }, this);
};

exports.JobController = JobController;

