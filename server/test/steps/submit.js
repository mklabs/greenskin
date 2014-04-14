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