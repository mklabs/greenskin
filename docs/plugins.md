
Plugins probably a really bad name. More subapps or simple middlewares.

The idea is to abstract away from job specific implementaiton and add
extension hook for any kind of Job.

## Anatomy

Is an express 4.x application, with:

- Standard view with the following tabs
- Current build: Display the last or currently job on CI
- Build history: A simple list of passed build
- Build view: When clicking on a particular build, access to job log and
  any other particular info for this job
- Edit: A form on top of the CI job config (XML file for Jenkins)
- Any other additional tabs

> TODO

---

### Basic example

**app.js**

```js
var path = require('path');
var express = require('express');

var app = module.exports = express();

var routes = require('./routes');

app.on('mount', function(gs) {
  // Attach here any initialization logic
  debug('App mounted, setting gs instance');

  app.gs = gs;

  // Application locals should be shared accross apps
  gs.locals.buttons.push({
    name: 'Create Job (simple metrics)',
    url: '/phantomas/create'
  });

  // Might register specific partials
  gs.hbs.registerPartials(path.join(__dirname, 'views/partials'));
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));

// Standard express setup
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
```

**routes.js**

```js

```

### Known routes

```js
router.get('/create', ...);
router.post('/create', ...);
router.get('/:name', ...);
router.get('/:name/number', ...);
router.get('/:name/builds', ...);
router.get('/:name/edit', ...);
router.post('/:name/edit', ...);
```

### Templates

The template engine is using Handlebars and donpark/hbs adapter for
express.

`res.render()` in subapps lookups in the subapp view directory, but they
are automatically decorated by the main application `views/layout.hbs`.

All partials / block helpers are also made available to the subapps.

> TODO: Document partials / block helpers

### Noop routes

Noop routes can be implemented, simply redirecting back to the general
namespace (for now '/view')

```js
router.get('/:name/builds', function(req, res, next) {
  res.redirect('/view/' + req.params.name + '/builds');
});
```
