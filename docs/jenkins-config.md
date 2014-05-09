
Talk here about XML config, `PERF_URLS` and other parameters.

How they translate into the UI (ex. `PERF_URLS`, available as `job.urls` and can display the form table)

Think of web components, but built with handlebars block, and a naive
CSS / JS sandboxing to the snippet of HTML.

## Jobs

Those are downstream jobs executed after monitoring jobs. They perform
post build actions, without very limited knowledge about the upstream
job.

Process the results for stats aggregation, or alerting, etc.

- statsd_send: Downstream job, uses a single `build.json` file from the
  UPSTREAM root.

### Parameters

- UPSTREAM_DATA - This is the absolute path of the build.json file

`build.json` is an array of Phantomas formatted results. They have:

- generator: Description of the system generating the metric.
- metrics: Hash of key value metrics pair. Key is the metric name, value
  is the value.
- asserts: Any failed asserts here
