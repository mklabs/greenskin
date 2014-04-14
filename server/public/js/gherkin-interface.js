(function(exports) {
    var steps = exports.steps = {};
    
    function add(keyword) {
        return function(reg, handler) {
            reg = reg.toString().replace(/^\/|\/$/g, '');
            var key = keyword + ' ' + reg;
            steps[key] = handler;
        };
    }
    
    exports.Given = add('Given');
    exports.When = add('When');
    exports.Then = add('Then');

})(this);