var glob = require( 'glob' )
    , path = require('path')
    , cp = require('child_process');
var app = require('the-internet-express');

var server = app.listen(3000, async () => {
    var args = process.argv;
    var run = (f) => new Promise((resolve, reject) => {
        console.log(path.parse(f).name);
        var a = args.includes('--observe') ? f + ' --observe': f;
        var env = process.env;
        env["SCREENCAST_ENABLED"] = args.includes('--screencast');
        var p = cp.exec('taiko ' + a, {env: env});
        p.stdout.pipe(process.stdout);
        p.stderr.pipe(process.stderr);
        p.on('exit', resolve);
        p.on('error', reject);
    });
    
    var prefix = args.filter(a => !['--observe', '--screencast'].includes(a))[2] || '';
    var examples = glob.sync('*.js')
        .filter(f => __filename !== path.resolve(f) && 'browserLauncher.js' !== f && f.startsWith(prefix))
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
