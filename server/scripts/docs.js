

var fs = require('fs');
var path = require('path');

var marked = require('marked');
var readme = fs.readFileSync(path.join(__dirname, '../../readme.md'), 'utf8');
var html = marked(readme);


console.log(html);
