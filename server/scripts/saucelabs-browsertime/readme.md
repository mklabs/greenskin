
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
  -H, --hostname         - Webdriver-grid hostname (default: ondemand.saucelabs.com)
  --port                 - Specify webdriver-grid port (default: 80)
  --help
```

Every webdriver enabled browser on Saucelabs, implementing [Navigation Timing API](http://caniuse.com/#feat=nav-timing) should be supported.

## Example

    # https://saucelabs.com/docs/onboarding
    export SAUCE_USERNAME=<your_username>
    export SAUCE_ACCESS_KEY=<your_accesskey>

    $ sauce-browsertime http://example.com

    # Multiple URLs run
    $ sauce-browsertime http://example.com http://example.com/page-one http://example.com/page-two

    # Turn off the log
    DEBUG="" sauce-browsertime http://example.com
    DEBUG="myapp" sauce-browsertime http://example.com

    # Redirect output (DEBUG logs are written to STDERR)
    sauce-browsertime http://example.com > results.json

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


*few examples (first one with full logs, turn them off with DEBUG="")*

JSON (default)

      $ sauce-browsertime http://example.com http://example.com/1 http://example.com/2
      sauce-browsertime Init tests on 3 urls +0ms
      sauce-browsertime Init browser +1ms { browserName: 'chrome',
      name: 'Collecting Navigation Timings with chrome',
      tags: [ 'sauce-browsertime' ] }
      sauce-browsertime Session ID eea3bb0762a44efd974e3dbe025d8a2c +5s
      sauce-browsertime Test URL: https://saucelabs.com/tests/eea3bb0762a44efd974e3dbe025d8a2c +0ms
      sauce-browsertime Getting http://example.com url +0ms
      sauce-browsertime Collecting navigation timings for http://example.com +1s
      sauce-browsertime Nav timings collected for http://example.com +902ms
      sauce-browsertime Getting http://example.com/1 url +0ms
      sauce-browsertime Collecting navigation timings for http://example.com/1 +4s
      sauce-browsertime Nav timings collected for http://example.com/1 +874ms
      sauce-browsertime Getting http://example.com/2 url +0ms
      sauce-browsertime Collecting navigation timings for http://example.com/2 +918ms
      sauce-browsertime Nav timings collected for http://example.com/2 +892ms
    {
      "stats": {
        "suites": 1,
        "tests": 3,
        "passes": 3,
        "pending": 0,
        "failures": 0,
        "start": "2014-04-29T20:21:13.305Z",
        "end": "2014-04-29T20:21:28.132Z",
        "duration": 14827
      },
      "tests": [
        {
          "title": "Collecting Navigation Timings with chrome - http://example.com",
          "fullTitle": "http://example.com Collecting Navigation Timings with chrome - http://example.com",
          "duration": {
            "loadEventEnd": 1398802875585,
            "loadEventStart": 1398802875585,
            "domComplete": 1398802875585,
            "domContentLoadedEventEnd": 1398802875584,
            "domContentLoadedEventStart": 1398802875584,
            "domInteractive": 1398802875584,
            "domLoading": 1398802875575,
            "responseEnd": 1398802875566,
            "responseStart": 1398802875564,
            "requestStart": 1398802875561,
            "secureConnectionStart": 0,
            "connectEnd": 1398802875530,
            "connectStart": 1398802875530,
            "domainLookupEnd": 1398802875530,
            "domainLookupStart": 1398802875530,
            "fetchStart": 1398802875530,
            "redirectEnd": 0,
            "redirectStart": 0,
            "unloadEventEnd": 0,
            "unloadEventStart": 0,
            "navigationStart": 1398802875530
          }
        },
        {
          "title": "Collecting Navigation Timings with chrome - http://example.com/1",
          "fullTitle": "http://example.com/1 Collecting Navigation Timings with chrome - http://example.com/1",
          "duration": {
            "loadEventEnd": 1398802881200,
            "loadEventStart": 1398802881200,
            "domComplete": 1398802881200,
            "domContentLoadedEventEnd": 1398802881200,
            "domContentLoadedEventStart": 1398802881200,
            "domInteractive": 1398802881200,
            "domLoading": 1398802881197,
            "responseEnd": 1398802881196,
            "responseStart": 1398802881189,
            "requestStart": 1398802881186,
            "secureConnectionStart": 0,
            "connectEnd": 1398802881184,
            "connectStart": 1398802881184,
            "domainLookupEnd": 1398802881184,
            "domainLookupStart": 1398802881184,
            "fetchStart": 1398802881184,
            "redirectEnd": 0,
            "redirectStart": 0,
            "unloadEventEnd": 1398802881191,
            "unloadEventStart": 1398802881191,
            "navigationStart": 1398802881184
          }
        },
        {
          "title": "Collecting Navigation Timings with chrome - http://example.com/2",
          "fullTitle": "http://example.com/2 Collecting Navigation Timings with chrome - http://example.com/2",
          "duration": {
            "loadEventEnd": 1398802883001,
            "loadEventStart": 1398802883001,
            "domComplete": 1398802883001,
            "domContentLoadedEventEnd": 1398802883001,
            "domContentLoadedEventStart": 1398802883001,
            "domInteractive": 1398802883001,
            "domLoading": 1398802882998,
            "responseEnd": 1398802882996,
            "responseStart": 1398802882990,
            "requestStart": 1398802882987,
            "secureConnectionStart": 0,
            "connectEnd": 1398802882985,
            "connectStart": 1398802882985,
            "domainLookupEnd": 1398802882985,
            "domainLookupStart": 1398802882985,
            "fetchStart": 1398802882985,
            "redirectEnd": 0,
            "redirectStart": 0,
            "unloadEventEnd": 1398802882991,
            "unloadEventStart": 1398802882991,
            "navigationStart": 1398802882985
          }
        }
      ],
      "failures": [],
      "passes": [
        {
          "title": "Collecting Navigation Timings with chrome - http://example.com",
          "fullTitle": "http://example.com Collecting Navigation Timings with chrome - http://example.com",
          "duration": {
            "loadEventEnd": 1398802875585,
            "loadEventStart": 1398802875585,
            "domComplete": 1398802875585,
            "domContentLoadedEventEnd": 1398802875584,
            "domContentLoadedEventStart": 1398802875584,
            "domInteractive": 1398802875584,
            "domLoading": 1398802875575,
            "responseEnd": 1398802875566,
            "responseStart": 1398802875564,
            "requestStart": 1398802875561,
            "secureConnectionStart": 0,
            "connectEnd": 1398802875530,
            "connectStart": 1398802875530,
            "domainLookupEnd": 1398802875530,
            "domainLookupStart": 1398802875530,
            "fetchStart": 1398802875530,
            "redirectEnd": 0,
            "redirectStart": 0,
            "unloadEventEnd": 0,
            "unloadEventStart": 0,
            "navigationStart": 1398802875530
          }
        },
        {
          "title": "Collecting Navigation Timings with chrome - http://example.com/1",
          "fullTitle": "http://example.com/1 Collecting Navigation Timings with chrome - http://example.com/1",
          "duration": {
            "loadEventEnd": 1398802881200,
            "loadEventStart": 1398802881200,
            "domComplete": 1398802881200,
            "domContentLoadedEventEnd": 1398802881200,
            "domContentLoadedEventStart": 1398802881200,
            "domInteractive": 1398802881200,
            "domLoading": 1398802881197,
            "responseEnd": 1398802881196,
            "responseStart": 1398802881189,
            "requestStart": 1398802881186,
            "secureConnectionStart": 0,
            "connectEnd": 1398802881184,
            "connectStart": 1398802881184,
            "domainLookupEnd": 1398802881184,
            "domainLookupStart": 1398802881184,
            "fetchStart": 1398802881184,
            "redirectEnd": 0,
            "redirectStart": 0,
            "unloadEventEnd": 1398802881191,
            "unloadEventStart": 1398802881191,
            "navigationStart": 1398802881184
          }
        },
        {
          "title": "Collecting Navigation Timings with chrome - http://example.com/2",
          "fullTitle": "http://example.com/2 Collecting Navigation Timings with chrome - http://example.com/2",
          "duration": {
            "loadEventEnd": 1398802883001,
            "loadEventStart": 1398802883001,
            "domComplete": 1398802883001,
            "domContentLoadedEventEnd": 1398802883001,
            "domContentLoadedEventStart": 1398802883001,
            "domInteractive": 1398802883001,
            "domLoading": 1398802882998,
            "responseEnd": 1398802882996,
            "responseStart": 1398802882990,
            "requestStart": 1398802882987,
            "secureConnectionStart": 0,
            "connectEnd": 1398802882985,
            "connectStart": 1398802882985,
            "domainLookupEnd": 1398802882985,
            "domainLookupStart": 1398802882985,
            "fetchStart": 1398802882985,
            "redirectEnd": 0,
            "redirectStart": 0,
            "unloadEventEnd": 1398802882991,
            "unloadEventStart": 1398802882991,
            "navigationStart": 1398802882985
          }
        }
      ]
    }  sauce-browsertime Ending session eea3bb0762a44efd974e3dbe025d8a2c +5ms




HTML

```
$ sauce-browsertime http://example.com --reporter doc
<section class="suite">
      <h1>Collecting Navigation Timings with chrome</h1>
      <dl>
        <dt>Collecting Navigation Timings with chrome - http://example.com</dt>
        <dd><pre><code>{
  &quot;loadEventEnd&quot;: 1398802517052,
  &quot;loadEventStart&quot;: 1398802517052,
  &quot;domComplete&quot;: 1398802517052,
  &quot;domContentLoadedEventEnd&quot;: 1398802517052,
  &quot;domContentLoadedEventStart&quot;: 1398802517052,
  &quot;domInteractive&quot;: 1398802517052,
  &quot;domLoading&quot;: 1398802517043,
  &quot;responseEnd&quot;: 1398802517036,
  &quot;responseStart&quot;: 1398802517035,
  &quot;requestStart&quot;: 1398802517024,
  &quot;secureConnectionStart&quot;: 0,
  &quot;connectEnd&quot;: 1398802516984,
  &quot;connectStart&quot;: 1398802516984,
  &quot;domainLookupEnd&quot;: 1398802516984,
  &quot;domainLookupStart&quot;: 1398802516984,
  &quot;fetchStart&quot;: 1398802516984,
  &quot;redirectEnd&quot;: 0,
  &quot;redirectStart&quot;: 0,
  &quot;unloadEventEnd&quot;: 0,
  &quot;unloadEventStart&quot;: 0,
  &quot;navigationStart&quot;: 1398802516984</code></pre></dd>
        <dt>Collecting Navigation Timings with chrome - http://example.com/1</dt>
        <dd><pre><code>{
  &quot;loadEventEnd&quot;: 1398802521883,
  &quot;loadEventStart&quot;: 1398802521883,
  &quot;domComplete&quot;: 1398802521883,
  &quot;domContentLoadedEventEnd&quot;: 1398802521874,
  &quot;domContentLoadedEventStart&quot;: 1398802521874,
  &quot;domInteractive&quot;: 1398802521874,
  &quot;domLoading&quot;: 1398802521872,
  &quot;responseEnd&quot;: 1398802521867,
  &quot;responseStart&quot;: 1398802521864,
  &quot;requestStart&quot;: 1398802521861,
  &quot;secureConnectionStart&quot;: 0,
  &quot;connectEnd&quot;: 1398802521859,
  &quot;connectStart&quot;: 1398802521859,
  &quot;domainLookupEnd&quot;: 1398802521859,
  &quot;domainLookupStart&quot;: 1398802521859,
  &quot;fetchStart&quot;: 1398802521859,
  &quot;redirectEnd&quot;: 0,
  &quot;redirectStart&quot;: 0,
  &quot;unloadEventEnd&quot;: 1398802521865,
  &quot;unloadEventStart&quot;: 1398802521865,
  &quot;navigationStart&quot;: 1398802521859</code></pre></dd>
        <dt>Collecting Navigation Timings with chrome - http://example.com/2</dt>
        <dd><pre><code>{
  &quot;loadEventEnd&quot;: 1398802523722,
  &quot;loadEventStart&quot;: 1398802523722,
  &quot;domComplete&quot;: 1398802523722,
  &quot;domContentLoadedEventEnd&quot;: 1398802523721,
  &quot;domContentLoadedEventStart&quot;: 1398802523721,
  &quot;domInteractive&quot;: 1398802523721,
  &quot;domLoading&quot;: 1398802523719,
  &quot;responseEnd&quot;: 1398802523715,
  &quot;responseStart&quot;: 1398802523711,
  &quot;requestStart&quot;: 1398802523709,
  &quot;secureConnectionStart&quot;: 0,
  &quot;connectEnd&quot;: 1398802523704,
  &quot;connectStart&quot;: 1398802523704,
  &quot;domainLookupEnd&quot;: 1398802523704,
  &quot;domainLookupStart&quot;: 1398802523704,
  &quot;fetchStart&quot;: 1398802523704,
  &quot;redirectEnd&quot;: 0,
  &quot;redirectStart&quot;: 0,
  &quot;unloadEventEnd&quot;: 1398802523715,
  &quot;unloadEventStart&quot;: 1398802523715,
  &quot;navigationStart&quot;: 1398802523704</code></pre></dd>
      </dl>
    </section>

```

Markdown

    $ sauce-browsertime http://example.com --reporter markdown
    # TOC
     - [Collecting Navigation Timings with chrome](#collecting-navigation-timings-with-chrome)
    <a name="collecting-navigation-timings-with-chrome"></a>
     Collecting Navigation Timings with chrome
    Collecting Navigation Timings with chrome - http://example.com.

    ```js
    {
      "loadEventEnd": 1398802673308,
      "loadEventStart": 1398802673308,
      "domComplete": 1398802673308,
      "domContentLoadedEventEnd": 1398802673308,
      "domContentLoadedEventStart": 1398802673308,
      "domInteractive": 1398802673308,
      "domLoading": 1398802673294,
      "responseEnd": 1398802673286,
      "responseStart": 1398802673285,
      "requestStart": 1398802673283,
      "secureConnectionStart": 0,
      "connectEnd": 1398802673253,
      "connectStart": 1398802673253,
      "domainLookupEnd": 1398802673253,
      "domainLookupStart": 1398802673253,
      "fetchStart": 1398802673253,
      "redirectEnd": 0,
      "redirectStart": 0,
      "unloadEventEnd": 0,
      "unloadEventStart": 0,
      "navigationStart": 1398802673253
    ```

    Collecting Navigation Timings with chrome - http://example.com/1.

    ```js
    {
      "loadEventEnd": 1398802678915,
      "loadEventStart": 1398802678915,
      "domComplete": 1398802678915,
      "domContentLoadedEventEnd": 1398802678915,
      "domContentLoadedEventStart": 1398802678915,
      "domInteractive": 1398802678915,
      "domLoading": 1398802678912,
      "responseEnd": 1398802678902,
      "responseStart": 1398802678901,
      "requestStart": 1398802678899,
      "secureConnectionStart": 0,
      "connectEnd": 1398802678896,
      "connectStart": 1398802678896,
      "domainLookupEnd": 1398802678896,
      "domainLookupStart": 1398802678896,
      "fetchStart": 1398802678896,
      "redirectEnd": 0,
      "redirectStart": 0,
      "unloadEventEnd": 1398802678903,
      "unloadEventStart": 1398802678903,
      "navigationStart": 1398802678896
    ```

    Collecting Navigation Timings with chrome - http://example.com/2.

    ```js
    {
      "loadEventEnd": 1398802680770,
      "loadEventStart": 1398802680770,
      "domComplete": 1398802680770,
      "domContentLoadedEventEnd": 1398802680770,
      "domContentLoadedEventStart": 1398802680770,
      "domInteractive": 1398802680770,
      "domLoading": 1398802680768,
      "responseEnd": 1398802680761,
      "responseStart": 1398802680761,
      "requestStart": 1398802680759,
      "secureConnectionStart": 0,
      "connectEnd": 1398802680757,
      "connectStart": 1398802680757,
      "domainLookupEnd": 1398802680757,
      "domainLookupStart": 1398802680757,
      "fetchStart": 1398802680757,
      "redirectEnd": 0,
      "redirectStart": 0,
      "unloadEventEnd": 1398802680761,
      "unloadEventStart": 1398802680761,
      "navigationStart": 1398802680757
    ```


Nyan!

    $ sauce-browsertime http://example.com http://example.com/page-one http://example.com/page-two --reporter nyan
     3   -_-__,------,
     0   -_-__|  /\_/\
     0   -_-_~|_( ^ .^)
         -_-_ ""  ""

      3 passing (18s)

### TODOs

- [] Assert system (like phantomas)
- [] Statsd / Graphite reporter
- [] HTML reporter with http://kaaes.github.io/timing/ widget
- [] Option for the number of runs, and stats (avg, median, percentiles)
- [] Storage option (--db, or --storage) to aggregate results over time. Can be simple JSON file, or adapters to various backend (Graphite, square/cube, Mongo, Redis, etc.)
