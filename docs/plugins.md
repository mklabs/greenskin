
Plugins probably a really bad name.

More subapps or simple middlewares.

The idea is to abstract away from job specific implementaiton and add extension hook for any kind of Job.

ex. phantomas or feature for now.

## Misc

- Everything should be namespaced: `/p/*` for phantomas, `/f/*` for
  features

- Job sets up basic info on the job type, namely type and namespace props.
  - namespace should be used in templates in the parent app to route to proper sub view / actions.

## Anatomy

Is an express 4.x application, with:

- Standard view with the following tabs
- Current build: Display the last or currently job on CI
- Build history: A simple list of passed build
- Build view: When clicking on a particular build, access to job log and
  any other particular info for this job
- Edit: A form on top of the CI job config (XML file for Jenkins)
- Any other additional tabs

## Example

A basic example

```js
// Express subapp
var app = module.exports = express();

// Trigger here any initialization logic
app.on('mount', function(parent) {
  // Attach websocket instance for access later on in routes
  app.ws = parent.ws;

  // Adding ./views to parent app view system
  parent.addViews(path.join(__dirname, 'views'));

  // Adding buttons
  var locals = parent.locals;
  locals.buttons.push({
    name: 'Create Job (Some type of job)',
    // Needs to match the mounted app namespace
    url: '/ns/create'
  });
});

// And then in parent app
app.use('ns', require('greenskin-subapp'));
```

## Known routes

```js
app.get('/create', routes.create);
app.get('/edit/:name', routes.edit);
app.get('/view/:name', routes.view);
app.get('/view/:name/:number', routes.buildView);
```

Really need to implement only 4 routes.

### GET /create

Job Creation

```js
var Job = require('greenskin').Job;

// A Jenkins Job XML configuration to use as a template
var xmlTemplate = fs.readFileSync(path.join(__dirname, 'config.xml'), 'utf8');

app.get('/create', function(req, res, next) {
  var job = new Job('', next, {
    // Should be the name of the package
    xml: xmlTemplate
  });

  // TODO: Implement that
  job.on('error', next);

  job.on('end', function(data) {
    // `data` is serialized data to pass through templates
    data.title = 'Create job (Browsertime)';
    // `/api/create` is the general form action
    // The form should include hidden input to hold XML config
    data.action = '/api/create';

    // We need to tell the application which namespace this job is tied to
    data.job.namespace = 'ns';

    // You can render your views, or reference one of the subapp.
    res.render('form', data);
  });

});
```

### GET /edit/:name

```js
app.get('/edit/:name', function edit(req, res, next) {
  var name = req.params.name;
  var job = new Job(name, next);

  job.on('end', function(data) {
    data.title = name;
    data.action = '/api/edit';
    data.edit = true;
    res.render('form', data);
  });
});
```

### GET /view/:name

Job summary. Showing last build infos.

```js
app.get('/view/:name', greenskin.routes.view);
```

### GET /view/:name/:number

Build view

```js
app.get('/view/:name/:number', greenskin.routes.buildView);
```

#### TODO

```js
// To ease creation / edition
app.get('/create', greenskin.create({
  xmlTemplate: fs.readFileSync(path.join(__dirname, 'config.xml'),
  namespace: 'ns',
  type: 'ns-type',
  template: 'form'
}));

app.get('/edit/:name', greenskin.edit({
  template: 'form'
}));
```
