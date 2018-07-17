var fs = require('fs');
var { execSync } = require('child_process');
var date = new Date();

var p = JSON.parse(fs.readFileSync('package.json'));
var m = date.getMonth() + 1 <= 9 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
p.version = p.version + '-nightly.' + date.getFullYear() + m + date.getDate();

fs.writeFileSync("package.json", JSON.stringify(p));

execSync('npm publish --tag nightly');

