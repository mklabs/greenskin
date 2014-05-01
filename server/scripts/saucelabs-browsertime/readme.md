
# Saucelabs Browsertime

Using Webdriver to collect Navigation Timing, on Saucelabs.

```
Usage: sauce-browsertime [options] [urls, ...]

    $ sauce-browsertime http://example.com -b firefox -n 3 --assert-pageload-max=5000 --assert-frontend-p90=2500

See https://saucelabs.com/platforms for the list of available OS / Browser / Version

Options:

  -b, --browser          - Saucelabs browser (default: chrome)
  -p, --platform         - Saucelabs platform (default: unspecified)
  -t, --type             - Saucelabs device type (default: unspecified)
  -o, --orientation      - Saucelabs device orientation (default: unspecified)
  -v, --version          - Saucelabs browser version (default: unspecified)
  -n, --runs             - Number of runs per URL (default: 1)
  -R, --reporter         - Mocha reporter (default: json)
  -H, --hostname         - Webdriver-grid hostname (default: ondemand.saucelabs.com)
  --port                 - Specify webdriver-grid port (default: 80)
  -h, --help

Asserts:

  --assert-name-stat=[value]   - Specify a test assertion on [name] metric
  --assert-name=value          - Specify a test assertion on [name] average value

Available stats: min, max, avg, media, mad, p60, p70, p80, p90
```

Every webdriver enabled browser on Saucelabs, implementing [Navigation Timing API](http://caniuse.com/#feat=nav-timing) should be supported.

## Example

```
$ sauce-browsertime test/urls.txt -n 3 --assert-pageLoadTime-max=2000 --assert-backendTime-max=800 --assert-backendTime-p90=500 --reporter spec

Collecting Navigation Timings with chrome
  saucelabs.com
    √ saucelabs.com #1
    √ saucelabs.com #2
    √ saucelabs.com #3

  https://developer.mozilla.org/en-US/docs/Navigation_timing
    √ https://developer.mozilla.org/en-US/docs/Navigation_timing #1
    √ https://developer.mozilla.org/en-US/docs/Navigation_timing #2
    √ https://developer.mozilla.org/en-US/docs/Navigation_timing #3

  https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/NavigationTiming/Overview.ht
ml
    √ https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/NavigationTiming/Overvie
w.html #1
    √ https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/NavigationTiming/Overvie
w.html #2
    √ https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/NavigationTiming/Overvie
w.html #3

  http://www.html5rocks.com/en/tutorials/webperformance/basics/
    √ http://www.html5rocks.com/en/tutorials/webperformance/basics/ #1
    √ http://www.html5rocks.com/en/tutorials/webperformance/basics/ #2
    √ http://www.html5rocks.com/en/tutorials/webperformance/basics/ #3

  http://caniuse.com/nav-timing
    √ http://caniuse.com/nav-timing #1
    √ http://caniuse.com/nav-timing #2
    √ http://caniuse.com/nav-timing #3

  http://kaaes.github.io/timing/info.html
    √ http://kaaes.github.io/timing/info.html #1
    √ http://kaaes.github.io/timing/info.html #2
    √ http://kaaes.github.io/timing/info.html #3

  http://docs.seleniumhq.org/projects/webdriver/
    √ http://docs.seleniumhq.org/projects/webdriver/ #1
    √ http://docs.seleniumhq.org/projects/webdriver/ #2
    √ http://docs.seleniumhq.org/projects/webdriver/ #3

Asserts - saucelabs.com
  √ Assert pageload max <= 2000 (Value: 318)
  √ Assert backend max <= 800 (Value: 32)
  √ Assert backend p90 <= 500 (Value: 32)
Asserts - https://developer.mozilla.org/en-US/docs/Navigation_timing
  √ Assert pageload max <= 2000 (Value: 1226)
  √ Assert backend max <= 800 (Value: 237)
  √ Assert backend p90 <= 500 (Value: 237)
Asserts - https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/NavigationTiming/Ove
rview.html
  1) Assert pageload max <= 2000 (Value: 3639)
  √ Assert backend max <= 800 (Value: 348)
  √ Assert backend p90 <= 500 (Value: 348)
Asserts - http://www.html5rocks.com/en/tutorials/webperformance/basics/
  √ Assert pageload max <= 2000 (Value: 1154)
  √ Assert backend max <= 800 (Value: 361)
  √ Assert backend p90 <= 500 (Value: 361)
Asserts - http://caniuse.com/nav-timing
  √ Assert pageload max <= 2000 (Value: 1296)
  √ Assert backend max <= 800 (Value: 178)
  √ Assert backend p90 <= 500 (Value: 178)
Asserts - http://kaaes.github.io/timing/info.html
  √ Assert pageload max <= 2000 (Value: 643)
  √ Assert backend max <= 800 (Value: 188)
  √ Assert backend p90 <= 500 (Value: 188)
Asserts - http://docs.seleniumhq.org/projects/webdriver/
  √ Assert pageload max <= 2000 (Value: 665)
  √ Assert backend max <= 800 (Value: 293)
  √ Assert backend p90 <= 500 (Value: 293)

  41 passing (57s)
  1 failing

  1) Collecting Navigation Timings with chrome Asserts - https://dvcs.w3.org/hg/
webperf/raw-file/tip/specs/NavigationTiming/Overview.html Assert pageload max <=
 2000 (Value: 3639):
     Error: Assert pageLoadTime-max <= 2000 (Value: 3639)
```

JSON output

```json
{
  "stats": {
    "suites": 2,
    "tests": 10,
    "passes": 10,
    "pending": 0,
    "failures": 0,
    "start": "2014-05-01T02:30:05.335Z",
    "timings": {
      "http://example.com": {
        "domainLookupTime": {
          "min": 0,
          "max": 118,
          "avg": 11.8,
          "median": 0,
          "mad": 0,
          "p60": 0,
          "p70": 0,
          "p80": 0,
          "p90": 59
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
          "max": 2,
          "avg": 0.2,
          "median": 0,
          "mad": 0,
          "p60": 0,
          "p70": 0,
          "p80": 0,
          "p90": 1
        },
        "serverResponseTime": {
          "min": 2,
          "max": 7,
          "avg": 4.1,
          "median": 4,
          "mad": 1,
          "p60": 5,
          "p70": 5,
          "p80": 5.5,
          "p90": 6.5
        },
        "pageDownloadTime": {
          "min": 0,
          "max": 7,
          "avg": 1.1,
          "median": 0.5,
          "mad": 0.5,
          "p60": 1,
          "p70": 1,
          "p80": 1,
          "p90": 4
        },
        "domInteractiveTime": {
          "min": 12,
          "max": 151,
          "avg": 30.1,
          "median": 16,
          "mad": 4,
          "p60": 19,
          "p70": 21,
          "p80": 22.5,
          "p90": 87.5
        },
        "domContentLoadedTime": {
          "min": 12,
          "max": 151,
          "avg": 30.2,
          "median": 16,
          "mad": 3.5,
          "p60": 19,
          "p70": 21,
          "p80": 22.5,
          "p90": 87.5
        },
        "pageLoadTime": {
          "min": 12,
          "max": 151,
          "avg": 30.4,
          "median": 16.5,
          "mad": 4,
          "p60": 19.5,
          "p70": 21.5,
          "p80": 23,
          "p90": 87.5
        },
        "frontEndTime": {
          "min": 5,
          "max": 18,
          "avg": 10.9,
          "median": 9.5,
          "mad": 2.5,
          "p60": 11,
          "p70": 13.5,
          "p80": 16,
          "p90": 17.5
        },
        "backEndTime": {
          "min": 5,
          "max": 126,
          "avg": 18.4,
          "median": 6.5,
          "mad": 1.5,
          "p60": 8,
          "p70": 8,
          "p80": 8.5,
          "p90": 67.5
        }
      }
    },
    "end": "2014-05-01T02:30:26.213Z",
    "duration": 20878
  },
  "test": [],
  "failures": [],
  "passes": []
}

```

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
