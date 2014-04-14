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