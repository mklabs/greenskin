
Talk here about XML config, `PERF_URLS` and other parameters.

How they translate into the UI (ex. `PERF_URLS`, available as `job.urls` and can display the form table)

Think of web components, but built with handlebars block, and a naive
CSS / JS sandboxing to the snippet of HTML.

## Downstream Jobs

On creation, the system should init downstream jobs used by any Jobs
generating metrics and asserts.

- statsd_send: Uses a single `build.json` file at the root of upstream
  job, parsing the array of results and `data.metrics`. The metrics hash
  is used to send metrics packet to a remote StatsD instance.

- asserts_check: Uses a single `build.json` file at the root of upstream
  job, parsing the array of results and `data.asserts`. Failing asserts
  generates an alert notification.

### Parameters

- UPSTREAM_DATA - This is the absolute path of the build.json file


### Build.json

`build.json` is an array of Phantomas formatted results. with:

- generator: Description of the system generating the metric.
- metrics: Hash of key value metrics pair. Key is the metric name, value
  is the value.
- asserts: Any failed asserts here.
