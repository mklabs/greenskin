

Given(/^I browse URL "([^"]+)"$/, function(url, done) {
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