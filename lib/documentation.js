const exec = require('child_process').exec;
const { taikoInstallationLocation } = require('./util');

const main = async () => {
  exec(
    'npx documentation build --shallow lib/taiko.js lib/elementWrapper/*.js lib/elements/*.js -o lib/api.json',
    (error) => {
      console.debug('Generating documentation to lib/api.json');
      if (error != null) {
        let local = taikoInstallationLocation();
        console.debug(error);
        console.warn(
          `\x1b[33mCould not generate API documentation. Run <node lib/documentation.js> in the directory ${local}.`,
        );
      }
    },
  );
};

if (!process.env.TAIKO_SKIP_DOCUMENTATION) {
  main();
}
