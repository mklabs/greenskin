
var unzip = require('unzip');
var request = require('request');

// Random code to build up build page from zipfile
//
// Flaky, getting error on long URLs

// TODO: Got random garbage data and wrong signature errors
// with the binary stream behind the reverse proxy. If so, have to
// request Jenkins directly (but better to find the proper apache /
// nginx conf)
var zipfile = workspace + '/' + data.number + '/*zip*/build.zip';


debug('Request zip file', zipfile);
request(zipfile)
  .pipe(unzip.Parse())
  .on('entry', function (entry) {
    var filename = entry.path;
    var type = entry.type; // 'Directory' or 'File'

    var parts = filename.match(/^\d+\/([^\/]+)\/(.+)/) || [];
    var url = parts[1] || '';
    var file = parts[2] || '';

    if (!(url && file)) return next('Zip: Cannot extract URL & file from entry');

    var data = results[url] = results[url] || {};

    debug('zip:', url, file);
    if (file === 'build.json') {
      data.build = entry;
    } else if (file === 'har.json') {
      data.har = entry;
    } else if (/^filmstrip/.test(file)) {
      data.screenshots = (data.screenshots || []);
      data.screenshots.push(entry);
    } else if (file === 'screenshot.png') {
      data.screenshot = entry;
    }
  })
  .on('error', function(err) {
    debug('Zip error:', err);
  })
  .on('close', function() {
    debug('Done zipping', Object.keys(results.example_com));

    // TODO: Async read of each stream to get raw data back
    var urls = Object.keys(results).map(function(url) {
      var urlData = {
        id: url,
        url: url,
        jenkinsHar: [workspace, data.number, url, 'har.json'].join('/'),
        localHar: '/phantomas/har/' + data.job.name + '/' + data.number + '/' + url + '.json',
        jenkinsFilmstripDir: [workspace, data.number, url, 'filmstrip'].join('/')
      };

      function extractTime(obj) {
        var value = obj.split('-').slice(-1)[0].replace('.png', '');
        return parseInt(value, 10);
      }

      urlData.screenshots = results[url].screenshots.map(function(entry) {
        return {
          url: workspace + '/' + entry.path,
          time: extractTime(entry.path)
        };
      }).sort(function(a, b) {
        return a.time > b.time;
      });

      return urlData;
    });

    data.job._urls = urls;
    res.render('build', data);
  });
