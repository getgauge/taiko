var glob = require( 'glob' )
    , path = require('path')
    , cp = require('child_process');
var app = require('the-internet-express');

var server = app.listen(3000, async () => {
    var run = (f) => new Promise((resolve, reject) => {
        console.log(path.parse(f).name);
        var p = cp.exec('taiko ' + f);
        p.stdout.pipe(process.stdout);
        p.stderr.pipe(process.stderr);
        p.on('exit', resolve);
        p.on('error', reject);
    });
    
    var examples = glob.sync('*.js')
        .filter(f => path.resolve(f) !== __filename)
        .map(f => {return {file:f, task: () => run(f)};});
    
    for (let example of examples){
        try {
            await example.task();
        } catch (e) {
            console.error('Unable to run ' + example.file + '\n' + e);
        }
    }
    console.log('Shutting down the Internet Express');
    server.close();
});
