
var moment = require('moment');
var phantomas = require('phantomas').metadata;
var metrics = Object.keys(phantomas.metrics);

var helpers = module.exports;

helpers.fromNow = (date) => {
  var m = moment(Date.parse(date)).fromNow();
  return m !== 'Invalid date' ? m : date;
};

helpers.moment = (date) => {
  var m = moment(Date.parse(date)).format('LLLL');
  return m !== 'Invalid date' ? m : '';
};

helpers.results = (results) => {
  if (!results) return '';

  return results
    .map((result) => {
      result.metrics = Object.keys(result.metrics)
        .filter((m) => {
          return !!metrics.find((metric) => {
            return metric === m &&
              m == 'timeToFirstByte'
          });
        })
        .map((m) => {
          return '<li>' + m + ': ' + result.metrics[m] + 'ms</li>';
        });

      var str = `<a href="${result.url}">${result.url}</a>`;
      str += '<ul>';
      str += result.metrics.join(' ');
      str += '</ul>';

      return str;
    }).join('\n');
};

helpers.json = (data) => {
  return JSON.stringify(data, null, 4);
};
