var glob = require( 'glob' )
    , path = require('path')
    , cp = require('child_process');
var app = require('the-internet-express');

var server = app.listen(3000, async () => {
    var args = process.argv;
    var observe = args[args.length-1] === '--observe';
    var run = (f) => new Promise((resolve, reject) => {
        console.log(path.parse(f).name);
        var a = observe ? f + ' --observe': f;
        var p = cp.exec('taiko ' + a);
        p.stdout.pipe(process.stdout);
        p.stderr.pipe(process.stderr);
        p.on('exit', resolve);
        p.on('error', reject);
    });
    
    var prefix = args[2] || '';
    var examples = glob.sync('*.js')
        .filter(f => path.resolve(f) !== __filename && f.startsWith(prefix))
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
