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