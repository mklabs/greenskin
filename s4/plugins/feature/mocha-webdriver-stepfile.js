

Given(/^I browse URL "([^"]+)"$/, function(url, done) {
  var wd = require('wd');

  var driver = this.driver = wd.remote('localhost', 9134);
  driver.init(function() {
    // driver#get should errback on invalid URL
    driver.get(url, done);
  });
});

// Screenshots step
Then(/I want to render the page at "([^"]+)"/, function(filename, done) {
  this.driver.saveScreenshot(filename, done);
});

// Basic DOM Steps (Clicking, forms, ...)

Then(/I click on "([^"]+)"/, function(selector, done) {
    var el = this.page.evaluate(function(selector) {
        var qsa = window.$ || document.querySelectorAll.bind(document);
      var el = qsa(selector);
        if (!el.length) return;
        el.click();
        return true;
    }, selector);

    if (!el) return done(new Error('Cannot get element ' + selector));
    done();
});

Then(/I fill "([^"]+)" in "([^"]+)"/, function(value, name, done) {
    var ok = this.page.evaluate(function(value, name) {
      var el = document.querySelector('[name="' + name + '"]');
      if (!el) return;
      el.value = value;
      return true;
    }, value, name);

    if (!ok) return done(new Error('Cannot get input ' + name));

    done();
});

Then(/I submit the form "([^"]+)"/, function(selector, done) {
  var self = this;
  this.page.onUrlChanged = function(url) {
    self.page.onUrlChanged = null;
    setTimeout(done, 1000);
  };


  var ok = this.page.evaluate(function(selector) {
    var form = document.querySelector(selector);
    if (!form) return false;
    form.submit();
    return true;
  }, selector);

  if (!ok) return done(new Error('Cannot get form ' + selector));
});

// Async helper steps

Then(/I wait for "([^"]+)" to be visible/, function(selector, done) {

  var jq = this.page.evaluate(function(selector) {
    return typeof window.$ === 'function';
  }, selector);

  if (!jq) return done(new Error('This step relies on a jQuery like $ variable and was not accessible on ' + this.page.url));

  var ok = false;

  var to = setTimeout(function() {
    done(new Error('Timeout error'));
  }, 10000);

  var page = this.page;
  (function next() {
    if (ok) {
      clearTimeout(to);
      return done();
    }

    setTimeout(function() {
      ok = page.evaluate(function(selector) {
        return $(selector).is(':visible');
      }, selector);

      next();
    }, 200);
  })();
});

Then(/I wait for (\d+)s/, function(delay, done) {
  delay = parseInt(delay, 10);
  if (isNaN(delay)) return done(new Error(delay + ' is not a number'));
  setTimeout(done, delay * 1000);
});


// Phantomas Steps

Then(/I want to phantomize the page/, function(done) {
  // compatibility layer for NodeJS modules
  process.argv = [];

  Function.prototype.bind = null;
  var Phantomas = require('phantomas/core/phantomas');
  var formatter = require('phantomas/core/formatter');

  var task = phantomas = new Phantomas({
    url: this.page.url,
    // verbose: true,
    'film-strip': true
  });

  phantomas.log('Running');

  try {
      phantomas.run();
  } catch(ex) {
      console.log('phantomas v' + phantomas.version + ' failed with an error:');
      console.log(ex);
      return done(ex);
  }

  var self = this;
  phantomas.on('results', function(res) {
    var json = formatter(res);
    var data = JSON.parse(json);
    self.results = data;
    done();
  });
});

Then(/"([^"]+)" metric should be less than "([^"]+)"/, function(key, assert, done) {
  if (!this.results) return done(new Error('Cannot access phantomas results. Be sure to run after phantomas.'));

  var metric = this.results.metrics[key];
  if (!this.results) return done(new Error('Cannot find metric ' + key + '. Valid metrics are: ' + Object.keys(this.results)));

  var assertval = parseInt(assert, 10);
  if (isNaN(assert)) return done(new Error(assert + ' is not a valid number'));

  console.log(metric);
  var value = metric;
  var val = parseInt(value, 10);
  val = isNaN(val) ? value : val;

  done(val < assertval ? null : new Error(val + ' < ' + assertval + ' assert failed'));
});
