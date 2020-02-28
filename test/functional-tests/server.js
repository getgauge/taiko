const cp = require('child_process');
const app = require('the-internet-express');

let server = app.listen(3001, async () => {
  let specs = process.env.npm_config_spec || 'specs';
  let run = () =>
    new Promise((resolve, reject) => {
      let p = cp.exec(`gauge run ${specs} -v --tags=\\!knownIssue --simple-console`, error => {
        if (error) {
          reject(error);
        }
        resolve();
      });
      p.stdout.pipe(process.stdout);
      p.stderr.pipe(process.stderr);
    });
  var failed = false;
  try {
    await run();
  } catch (e) {
    console.error(e);
    failed = true;
  }
  console.log('Shutting down the Internet Express');
  server.close(e => {
    if (e) {
      console.error('Failed to close the Internet Express', e);
      failed = true;
    }
  });
  if (failed) process.exit(1);
});
