

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
  this.driver.elementByCssSelector(selector, function(err, element) {
    if (err) return done(err);
    element.click(done);
  });
});

Then(/I submit the form "([^"]+)"/, function(selector, done) {
  this.driver.elementByCssSelector(selector, function(err, element) {
    if (err) return done(err);
    element.submit(done);
  });
});

Then(/I fill "([^"]+)" in "([^"]+)"/, function(value, name, done) {
  var driver = this.driver;
  this.driver.elementByCssSelector('[name=' + name + ']', function(err, element) {
    if (err) return done(err);
    driver.type(element, value, done);
  });
});

// Async helper steps

Then(/I wait for "([^"]+)" to be visible/, function(selector, done) {
  var driver = this.driver;
  (function check() {
    driver.elementByCssSelector(selector, function(err, element) {
      if (err) return done(err);
      element.isDisplayed(function(err, visible) {
        if (err) return done(err);
        if (visible) return done();
        setTimeout(check, 500);
      });
    });
  })();
});

Then(/I wait for (\d+)s/, function(delay, done) {
  delay = parseInt(delay, 10);
  if (isNaN(delay)) return done(new Error(delay + ' is not a number'));
  setTimeout(done, delay * 1000);
});
