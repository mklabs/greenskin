
# Saucelabs Browsertime

Using Webdriver to collect Navigation Timing, on Saucelabs.

```
Usage: sauce-browsertime [options] [urls, ...]

    $ sauce-browsertime http://example.com
    $ sauce-browsertime http://example.com/page-one http://example.com/page-two
    $ sauce-browsertime http://example.com/page-one --browser android

See https://saucelabs.com/platforms for the list of available OS / Browser / Version

Options:

  -b, --browser          - Saucelabs browser (default: chrome)
  -p, --platform         - Saucelabs platform (default: unspecified)
  -t, --type             - Saucelabs device type (default: unspecified)
  -o, --orientation      - Saucelabs device orientation (default: unspecified)
  -v, --version          - Saucelabs browser version (default: unspecified)
  -R, --reporter         - Mocha reporter (default: json)
  -n, --runs             - Number of runs per URL (default: 1)
  -H, --hostname         - Webdriver-grid hostname (default: ondemand.saucelabs.com)
  --port                 - Specify webdriver-grid port (default: 80)
  -h, --help
```

Every webdriver enabled browser on Saucelabs, implementing [Navigation Timing API](http://caniuse.com/#feat=nav-timing) should be supported.

## Usage

    # https://saucelabs.com/docs/onboarding
    export SAUCE_USERNAME=<your_username>
    export SAUCE_ACCESS_KEY=<your_accesskey>

    $ sauce-browsertime http://example.com

    # Multiple URLs run
    $ sauce-browsertime http://example.com http://example.com/page-one http://example.com/page-two

    # Turn on the log
    $ DEBUG="sauce-browsertime" sauce-browsertime http://example.com

    # Redirect output (DEBUG logs are written to STDERR)
    $ DEBUG="sauce-browsertime" sauce-browsertime http://example.com > results.json

    # Multiple runs per URL
    $ sauce-browsertime http://example.com -n 3

## Reporters

Mocha reporters should be usable for the most part

    $ mocha --reporters

        dot - dot matrix
        doc - html documentation
        spec - hierarchical spec list
        json - single json object
        progress - progress bar
        list - spec-style listing
        tap - test-anything-protocol
        landing - unicode landing strip
        xunit - xunit reporter
        html-cov - HTML test coverage
        json-cov - JSON test coverage
        min - minimal reporter (great with --watch)
        json-stream - newline delimited json events
        markdown - markdown documentation (github flavour)
        nyan - nyan cat!


*few examples*

JSON (default)

    $ sauce-browsertime http://example.com -n 3 --reporter json
    {
      "stats": {
        "suites": 2,
        "tests": 3,
        "passes": 3,
        "pending": 0,
        "failures": 0,
        "start": "2014-04-30T21:28:43.124Z",
        "timings": {
          "http://example.com": {
            "domainLookupTime": {
              "min": 0,
              "max": 0,
              "avg": 0,
              "median": 0,
              "mad": 0,
              "p60": 0,
              "p70": 0,
              "p80": 0,
              "p90": 0
            },
            "redirectionTime": {
              "min": 0,
              "max": 0,
              "avg": 0,
              "median": 0,
              "mad": 0,
              "p60": 0,
              "p70": 0,
              "p80": 0,
              "p90": 0
            },
            "serverConnectionTime": {
              "min": 0,
              "max": 0,
              "avg": 0,
              "median": 0,
              "mad": 0,
              "p60": 0,
              "p70": 0,
              "p80": 0,
              "p90": 0
            },
            "serverResponseTime": {
              "min": 2,
              "max": 6,
              "avg": 4,
              "median": 4,
              "mad": 2,
              "p60": 4,
              "p70": 6,
              "p80": 6,
              "p90": 6
            },
            "pageDownloadTime": {
              "min": 0,
              "max": 1,
              "avg": 0.77777777777777777,
              "median": 1,
              "mad": 0,
              "p60": 1,
              "p70": 1,
              "p80": 1,
              "p90": 1
            },
            "domInteractiveTime": {
              "min": 17,
              "max": 46,
              "avg": 29.333333333333332,
              "median": 25,
              "mad": 8,
              "p60": 25,
              "p70": 46,
              "p80": 46,
              "p90": 46
            },
            "domContentLoadedTime": {
              "min": 17,
              "max": 46,
              "avg": 29.333333333333332,
              "median": 25,
              "mad": 8,
              "p60": 25,
              "p70": 46,
              "p80": 46,
              "p90": 46
            },
            "pageLoadTime": {
              "min": 19,
              "max": 46,
              "avg": 30,
              "median": 25,
              "mad": 6,
              "p60": 25,
              "p70": 46,
              "p80": 46,
              "p90": 46
            },
            "frontEndTime": {
              "min": 11,
              "max": 20,
              "avg": 14.333333333333334,
              "median": 12,
              "mad": 1,
              "p60": 12,
              "p70": 20,
              "p80": 20,
              "p90": 20
            },
            "backEndTime": {
              "min": 4,
              "max": 33,
              "avg": 15,
              "median": 8,
              "mad": 4,
              "p60": 8,
              "p70": 33,
              "p80": 33,
              "p90": 33
            }
          }
        },
        "caps": {
          "rotatable": false,
          "browserConnectionEnabled": false,
          "acceptSslCerts": false,
          "cssSelectorsEnabled": true,
          "javascriptEnabled": true,
          "databaseEnabled": false,
          "chrome.chromedriverVersion": "26.0.1383.0",
          "locationContextEnabled": false,
          "takesScreenshot": true,
          "platform": "linux",
          "browserName": "chrome",
          "version": "28.0.1500.95",
          "hasMetadata": true,
          "nativeEvents": true,
          "applicationCacheEnabled": false,
          "webStorageEnabled": true,
          "handlesAlerts": true
        },
        "end": "2014-04-30T21:28:52.644Z",
        "duration": 9520
      },
      "tests": [ ... includes raw timings here as duration props ... ],
      "passes": [ ... same as above ... ]

Spec

    $ sauce-browsertime http://example.com -n 3 --reporter spec

    Collecting Navigation Timings with chrome
      http://example.com
        √ http://example.com #1
        √ http://example.com #2
        √ http://example.com #3


      3 passing (11s)

Nyan!

    $ sauce-browsertime http://example.com http://example.com/page-one http://example.com/page-two -n 4 --reporter nyan

     12  -_-_-_-_-_-_-_,------,
     0   -_-_-_-_-_-_-_|   /\_/\
     0   -_-_-_-_-_-_-^|__( ^ .^)
         -_-_-_-_-_-_-  ""  ""

      12 passing (23s)

## HTML templates

Not a a mocha reporter per say. Transforms the raw JSON data of a
previous run into an HTML page, with visual representation of the Timing
objects thanks to http://kaaes.github.io/timing/

    Usage: sauce-browsertime-html [options] file.json

        $ sauce-browsertime results.json > index.html

    Graphs generated thanks to http://kaaes.github.io/timing/
    Browser logos thanks to https://github.com/alrra/browser-logos

    Options:

      -b, --browser          - Browser under test (used to match browser logo)

## Jenkins template

`config.xml` file is a Jenkins Job template that can be used to quickly
setup a Job to run the perf test, at a fixed interval or on SCM change:

- Includes Job parameters for:
  - `PERF_URLS`: List of URLs to test. Whitespace separated.
  - `SAUCE_USERNAME`: Saucelabs username
  - `SAUCE_ACCESS_KEY`: Saucelabs API key
  - `SAUCE_BROWSERS`: Comma separated list of browsers.

- Shell scripts
  - Install npm packages on first run (npm install saucelabs-browsertime)
  - A run for each browser, stats & raw metrics available at `./results/BUILD_NUMBER/BROWSER/metrics.json`, HTML report at `./results/BUILD_NUMBER/BROWSER/metrics.json`.

- Plugin configuration for htmlpublisher (optional to have it installed,
  jenkins will just ignore the conf)

See config.xml file for further detail

### TODOs

- [] Assert system (like phantomas)
- [] Statsd / Graphite reporter
- [x] HTML reporter with http://kaaes.github.io/timing/ widget
- [x] Option for the number of runs, and stats (avg, median, percentiles)
