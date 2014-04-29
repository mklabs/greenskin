
# Saucelabs Browsertime

Using Webdriver to collect Navigation Timing.

## Usage

    $ sauce-browsertime http://example.com

    # Multiple URLs run
    $ sauce-browsertime http://example.com http://example.com/page

    # Set desired browser, see: https://saucelabs.com/platforms

## Browser configuration

See https://saucelabs.com/platforms

Every webdriver enabled browser on Saucelabs, implementing [Navigation Timing API](http://caniuse.com/#feat=nav-timing) should be supported.


```js
# In config.js
caps = {browserName: 'firefox'};
caps.platform = 'Windows XP';
caps.version = '3.6';
```

Run

```
$ sauce-browsertime http://example.com --config config.js
```




