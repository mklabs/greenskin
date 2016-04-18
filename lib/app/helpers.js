
var moment = require('moment');
var phantomas = require('phantomas').metadata;
var metrics = Object.keys(phantomas.metrics);

var helpers = module.exports;

helpers.fromNow = (date) => {
  return moment(Date.parse(date)).fromNow();
};

helpers.moment = (date) => {
  console.log(date);
  return moment(Date.parse(date)).format('LLLL');
};

helpers.results = (results) => {
  if (!results) return '';

  return results
    .map((result) => {
      result.metrics = Object.keys(result.metrics)
        .filter((m) => {
          return !!metrics.find((metric) => {
            return metric === m &&
              m == 'domContentLoaded'
              // phantomas.metrics[metric].module === 'windowPerformance';
          });
        })
        .map((m) => {
          return '<li>' + m + ': ' + result.metrics[m] + '</li>';
        });

      var str = `<a href="${result.url}">${result.url}</a>`;
      str += '<ul>';
      str += result.metrics.join(' ');
      str += '</ul>';

      return str;
    }).join('\n');
};
