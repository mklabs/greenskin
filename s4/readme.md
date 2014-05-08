
# App

This directory holds the express application.


- bin/: Startup script
- lib/: Library files
- public/: Static file serving under `/` pathname
- routes/: Routes definitions
- views/: Handlebars templates

## Sub-apps

The `plugins/` directory holds a series of express webapp, providing job
specialization views / actions for specific job like:

- `[plugins/phantomas](./plugins/phantomas)`

These plugins should eventually be packaged in an external repository.

## Run

    DEBUG=gs* node bin/www

**Note** If using Jenkins, make sure to update the package.json file and
its `config` prop, or ensure you have started the vagrant
`jenkins-master` VM.

## API

app.js is the main entry point


    var app = require('./app');

## Tests

    npm test
