var fs = require('fs');
var { exec } = require('child_process');
var date = new Date();

var p = JSON.parse(fs.readFileSync('package.json'));
var m = date.getMonth() + 1 <= 9 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
p.version = p.version + '-nightly.' + date.getFullYear() + m + date.getDate();

fs.writeFileSync("package.json", JSON.stringify(p));

exec('npm publish --tag nightly', (err, stdout, stderr) => {
    if (err) {
        console.log('Could not publish. Error : ', err);
        return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
});

