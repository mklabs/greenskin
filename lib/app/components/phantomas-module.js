var uniq  = require('lodash.uniq');
var kebab = require('lodash.kebabcase');

var phantomas = require('phantomas').metadata;

module.exports = class PhantomasModule {
  constructor(result) {
    this.result = result;

    console.log(this.result);
    this.url = this.result.url;
    this.metrics = this.result.metrics;
    this.offenders = this.result.offenders;
    this.asserts = this.result.asserts;
  }

  get modules() {
    return uniq(Object.keys(phantomas.metrics).map((key) => {
      return phantomas.metrics[key].module;
    }));
  }

  get colors() {
    return [
      '#8da0cb',
      '#bada55',
      '#65c2a5',
      '#e78ac3',
      '#fc8d62',
      '#65c2a5',
      '#a6d854',
      '#ffd92f'
    ];

  }

  toArray() {
    var modules = this.modules;

    modules = ['windowPerformance', 'assetsTypes', 'timeToFirst'];

    modules = modules.map((module) => {
      return {
        name: module,
        metrics: this.buildMetrics(module)
      };
    });


    return modules;
  }

  buildMetrics(module) {
    var metrics = this.getMetrics(module);
    var colors = this.colors;
    return metrics.map((metric) => {
      var unit = phantomas.metrics[metric].unit;
      return {
        label: metric,
        value: this.metrics[metric],
        description: phantomas.metrics[metric].desc,
        unit: unit === 'number' ? '' :
          unit === 'bytes' ? 'b' : unit,
        className: kebab(metric),
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    });
  }

  getMetrics(module) {
    return Object.keys(this.metrics).filter((metric) => {
      var m = phantomas.metrics[metric];
      return m && m.module === module;
    });
  }
}
