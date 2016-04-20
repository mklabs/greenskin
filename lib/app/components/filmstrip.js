var fs     = require('fs');
var path   = require('path');
var moment = require('moment');
var debug  = require('debug')('greenskin:component:filmstrip');

module.exports = class name {
  constructor(doc) {
    this.doc = doc;
  }

  build(done) {
    var doc = this.doc;

    debug('Building %s', doc.name);
    if (!doc.lastRunResults) return new Promise((r, errback) => {
      r();
    });;

    var promises = doc.lastRunResults.map(this.readdir);
    return Promise.all(promises)
      .catch(done)
      .then((fileList) => {

        doc.urls = doc.urls.map((url) => {
          var files = fileList.find((f) => f.url === url.url );

          if (!(files && files.files.length)) return url;

          url.images = files.files.map((file) => {
            // console.log('files filmdir', files.filmdir);
            return {
              src: path.join(files.filmdir, file),
              title: file.split('-').slice(-1)[0].replace(/\.png$/, '') + ' ms'
            };
          });

          var filmstripWidth = url.images.length * 420;
          if (!url.filmstripWidth || filmstripWidth > url.filmstripWidth) {
            url.filmstripWidth = filmstripWidth
          }

          return url;
        });

      });
  }

  readdir(result) {
    var filmdir = path.join(__dirname, '../../app/public', result.filmstripdir);

    debug('readdir', Object.keys(result));
    return new Promise((r, errback) => {
      fs.readdir(filmdir, (err, files) => {
        if (err) return errback(err);

        files = files.sort(function(a, b) {
          var timeA = Number(a.split('-').slice(-1)[0].replace(/\.png/, ''));
          var timeB = Number(b.split('-').slice(-1)[0].replace(/\.png/, ''));
          if (timeA === timeB) return 0;
          return timeA > timeB ? 1 : -1;
        });

        return r({
          url: result.url,
          filmdir: result.filmstripdir,
          files: files
        });
      });
    });
  }
}
