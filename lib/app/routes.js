var debug    = require('debug')('greenskin:routes');
var messages = require('express-messages');
var Router   = require('./router');

var TopComponent = require('./components/top');
var PhantomasModuleComponent = require('./components/phantomas-module');

class Routes extends Router {

  get routes() {
    return {
      '/':               'index',
      '/list':           'list',
      '/create':         'create',
      '/job/:name':      'job',
      '/job/:name/:url': 'job',
      'POST /create':    'createPost'
    };
  }

  get defaults() {
    return {
      name: 'Job name',
      frequency: '5 minutes',
      urls: 'http://example.com http://example.com/page/2',
      config: JSON.stringify({ asserts: { loadTime: 2000 } }, null, 2)
    }
  }

  // Routes

  index(req, res, next) {
    this.api.query().catch(next).then((jobs) => {
      jobs = jobs.map((job) => {
        job.config = JSON.stringify(job.data);
        return job;
      });

      this.render(req, res, 'index', {
        jobs: jobs,
        piecharts: [{
          label: 'Checkout the <a href="https://github.com/mklabs/greenskin">GitHub repo</a> for more information on setup & usage.',
          icon: 'social-github'
        }, {
          label: 'A bug ? A feature request ?',
          value: 'Head over to <a href="https://github.com/mklabs/greenskin/issues">the repository bug tracker</a> and create a new issue',
          icon: 'bug'
        }, {
          label: '<a href="https://github.com/mklabs/greenskin">GitHub project wiki</a>',
          value: 'Be sure to check the project documentation.',
          icon: 'social-octocat'
        }, {
          label: 'Easy monitoring',
          value: 'Monitor any number of metrics. Configure as many sites as you want.',
          icon: 'happy'
        }]
      });
    });
  }

  list(req, res, next) {
    this.api.query().catch(next).then((jobs) => {
      if (!jobs.length) return this.index(req, res, next);

      this.render(req, res, 'list', {
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
      .query({ name: body.name })
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

        item.config.urls = item.urls;

        return this.api.create(item).then(() => {
          this.index(req, res, next);
        })
      })
      .catch(next);
  }

  job(req, res, next) {
    var name = req.params.name;
    var url = req.params.url;

    debug('Job view for %s job', name);
    this.api.query({ name: name })
      .catch(next)
      .then((doc) => {
        var doc = doc[0];
        if (!doc) return next(new Error('No job named "' + name + '"'));

        doc.top = new TopComponent(doc).toArray();
        doc.urls = doc.lastRunResults.map((result) => {
          return {
            url: result.url,
            modules: (new PhantomasModuleComponent(result)).toArray(),
            selected: result.url === url
          };
        });

        if (!url) doc.urls[0].selected = true;
        console.log('top');
        console.log(doc.top);
        this.render(req, res, 'job', doc);
      });
  }

  // Helpers

  render(req, res, view = 'index', data = {}) {
    return res.render(view, Object.assign({}, data, {
      helpers: {
        messages: messages(req, res)
      }
    }));
  }
}

module.exports = Routes;
