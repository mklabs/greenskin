// Example of using webdriver to implement browsing steps

var webdriver = nopt.webdriver || 9134;
var webdriverHost = nopt['webdriver-host'] || 'localhost';

Given(/I browse URL "([^"]+)"/, function(url, done) {
  var wd = require('wd');

  if (!this.driver) this.driver = wd.remote(webdriverHost, webdriver);

  var driver = this.driver;
  driver.init(function() {
    // driver#get should errback on invalid URL
    driver.get(url, done);
  });
});

Then(/I want to render the page at "([^"]+)"/, function(filename, done) {
  this.driver.saveScreenshot(filename, done);
});

Then(/I click on "([^"]+)"/, function(selector, done) {
  done();
});

Then(/I submit the form "([^"]+)"/, function(selector, done) {
  var driver = this.driver;
  driver.elementByCssSelector(selector, function(err, element) {
    if (err) return done(err);
    element.submit(done);
  });
});

Then(/I fill "([^"]+)" in "([^"]+)"/, function(value, name, done) {
  var driver = this.driver;
  driver.elementByCssSelector('[name=' + name + ']', function(err, element) {
    if (err) return done(err);
    driver.type(element, value, done);
  });
});
