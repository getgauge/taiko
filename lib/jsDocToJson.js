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
