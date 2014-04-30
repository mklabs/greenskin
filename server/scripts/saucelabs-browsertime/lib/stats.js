
var ss = require('simple-statistics');

module.exports = Stats;

function Stats(name, data) {
  var list = this.data = data;
  this.name = name;

  this.min = ss.min(list);
  this.max = ss.max(list);
  this.avg = ss.mean(list);
  this.median = ss.median(list);
  // https://github.com/tmcw/simple-statistics#median_absolute_deviationx
  this.mad = ss.mad(list);
  this.p60 = ss.quantile(list, 0.60);
  this.p70 = ss.quantile(list, 0.70);
  this.p80 = ss.quantile(list, 0.80);
  this.p90 = ss.quantile(list, 0.90);
}

Stats.prototype.toJSON = function toJSON() {
  return {
    name: this.name,
    min: this.min,
    max: this.max,
    avg: this.avg,
    median: this.median,
    mad: this.mad,
    p60: this.p60,
    p70: this.p70,
    p80: this.p80,
    p90: this.p90
  };
};
