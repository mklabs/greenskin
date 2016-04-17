var debug = require('debug')('greenskin:routes');
var messages = require('express-messages');

class Routes {
  constructor(api) {
    this.api = api;
  }

  get defaults() {
    return {
      name: 'Job name',
      frequency: '5 minutes',
      urls: 'http://example.com http://example.com/page/2',
      config: JSON.stringify({ asserts: { loadTime: 2000 } }, null, 2)
    }
  }

  index(req, res, next) {
    this.api.job().catch(next).then((jobs) => {
      jobs = jobs.map((job) => {
        job.config = JSON.stringify(job.config);
        job.urls = job.urls.join('<br />');
        return job;
      });

      res.render('index', {
        jobs: jobs
      });
    });
  }

  list(req, res, next) {
    this.api.job().catch(next).then(function(jobs) {
      jobs = jobs.map(function(job) {
        job.config = JSON.stringify(job.config);
        job.urls = job.urls.join('<br />');
        return job;
      });

      res.render('list', {
        jobs: jobs
      });
    });
  }

  create(req, res, next) {
    var job = Object.assign({}, this.defaults, req.body);

    this.render(req, res, 'create', {
      job: job
    });
  }

  createPost(req, res, next) {
    var body = req.body;

    var config = '';
    try {
      config = JSON.parse(body.config);
    } catch(e) {
      return next(e);
    }

    this.api
      .job({ name: body.name })
      .then((doc) => {
        if (doc.length) {
          req.flash('error', 'There is already a job named ' + body.name);
          return this.create(req, res, next);
        }

        var item = {
          name: body.name,
          urls: body.urls.split(' '),
          config: config,
          frequency: body.frequency
        };

        return this.api.create(item)
          .then(() => {
            this.list(req, res, next);
          });
      })
      .catch(next);

  }

  render(req, res, view = 'index', data = {}) {
    return res.render(view, Object.assign({}, data, {
      helpers: {
        messages: () => {
          var msg = messages(req, res)();
          if (!msg) return;

          var str ='<div class="alert bg-warning"><strong>Warning!</strong>';
          str += msg;
          str += '</div>'
          return str;
        }
      }
    }));
  }
}

module.exports = Routes;
