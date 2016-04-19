var uniq  = require('lodash.uniq');
var kebab = require('lodash.kebabcase');

var phantomas = require('phantomas').metadata;

module.exports = class PhantomasModule {
  constructor(result) {
    this.result = result;

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

      var value = '' + this.metrics[metric];
      var data = this[metric] ? this[metric](value) : {};
      var lvl = Math.floor(Math.abs(4 - (value.length - 3)));
      lvl = lvl > 4 ? 4 : lvl;

      return Object.assign({
        label: metric,
        value: this.metrics[metric],
        description: phantomas.metrics[metric].desc,
        unit: unit === 'number' ? '' : unit,
        className: kebab(metric),
        // classNameLvl: value.length > 3 ? lvl : 4,
        classNameLvl: lvl,
        color: colors[Math.floor(Math.random() * colors.length)],
        module: module,
        slug: kebab(module),
        piechart: unit === '%'
      }, data);
    });
  }

  getMetrics(module) {
    return Object.keys(this.metrics).filter((metric) => {
      var m = phantomas.metrics[metric];
      return m && m.module === module;
    });
  }

  // Metric specific handling
  domContentLoaded(metric) {
    let domComplete = this.metrics.domComplete;
    let percent = Math.round((metric * 100) / domComplete);

    if (!domComplete) return {};
    return {
      piechart: true,
      value: percent,
      originalValue: metric,
      unit: '%',
      chartText: percent + '% of domComplete time (' + metric + 'ms)'
    };
  }
}
