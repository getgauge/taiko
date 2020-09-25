const exec = require('child_process').exec;
const { taikoInstallationLocation } = require('./util');
const { promisify } = require('util');
const execWithPromise = promisify(exec);

const jsDocToJson = async (sourceFiles, outputFile) => {
  const command = `npx documentation build --shallow ${sourceFiles} -o ${outputFile} `;
  console.log('executing: ' + command);
  try {
    await execWithPromise(command);
  } catch (error) {
    console.debug('Generating documentation to lib/api.json');
    let local = taikoInstallationLocation();
    console.debug(error);
    console.warn(
      `\x1b[33mCould not generate API documentation. Run <node lib/documentation.js> in the directory ${local}.`,
    );
  }
  console.log('executed successfully: ' + command);
};
module.exports.jsDocToJson = jsDocToJson;

/** isRunDirectlyFromTheCommandLine
 *  true - if this module was run directly from the command line as in `node documentation.js`
 *  false - if it is imported by another module
 */
const isRunDirectlyFromTheCommandLine = require.main === module;

if (isRunDirectlyFromTheCommandLine && !process.env.TAIKO_SKIP_DOCUMENTATION) {
  const sourceFiles = 'lib/taiko.js lib/elementWrapper/*.js';
  const outputFile = 'lib/api.json';
  jsDocToJson(sourceFiles, outputFile);
}
