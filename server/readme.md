
# Server

## Components

Systems

- Express
- Jenkins
- Graphite
- PhantomJS
- Phantomas

Frontend

- bootstrap v3
- CodeMirror
- socket.io
- momentjs
- highcharts
- screenfull.js
- jquery-cron
- jsonlint
- select2
- har-viewer
- ansiparse (with a bit of CSS from travis.org)
- cucumber/gherkin

## Description

An express based server to help monitor frontend application and gather
performance-focused metrics.  Monitoring can consist of simple metrics
measurement, or more complex functional scenario written in Gherkin
syntax (the langage behind Cucumber)

It usually consists in a list of URLs, analyzed at a fixed interval,
where metrics are sent and aggregated by Graphite (and written to
Jenkins Workspace)

### Jobs

Setting up a new "monitoring bucket" means setting up the proper Jenkins
job, at the proper interval, with the correct configuration and run
scripts.

....
