Given(/I browse URL "([^"]+)"/, function(url, done) {
    var page = this.page = require('webpage').create();
    page.open(url, function(status) {
        if (status !== 'success') return done(new Error(status));
        done();
    });
});

Then(/I want to render the page at "([^"]+)"/, function(filename, done) {
    this.page.render(filename);
    done();
});

Then(/I click osn "([^"]+)"/, function(selector, done) {
    var el = this.page.evaluate(function(selector) {
    	var el = document.querySelectorAll(selector);
        return el.length;
    }, selector);

    if (!el) return done(new Error('Cannot get element ' + selector));
    done();
});

Then(/I submit the form "([^"]+)"/, function(selector, done) {
  var self = this;
  this.page.onUrlChanged = function(url) {
    self.page.onUrlChanged = null;
    console.log('url changed', url);
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
