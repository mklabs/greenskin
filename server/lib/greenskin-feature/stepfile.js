// Example of using webdriver to implement browsing steps
Then(/I want to collect navigation timings at "([^"]+)"/, function(filepath, done) {
  var fs = require('fs');
  var path = require('path');
  var mkdirp = require('mkdirp');

  this.driver.safeExecute("window.performance ? (window.performance.toJSON ? JSON.stringify(window.performance.toJSON()) : window.performance) : '{}'", function(err, res) {
	if (err) return done(err);
    mkdirp.sync(path.dirname(filepath));
    fs.writeFileSync(filepath, res);
    done();
  });

});


Given(/I browse URL "([^"]+)"/, function(url, done) {
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

