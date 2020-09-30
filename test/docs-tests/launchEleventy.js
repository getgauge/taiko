const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const launchEleventy = async () => {
  const command = 'npx eleventy ';
  console.log('executing: ' + command);
  try {
    await exec(command);
  } catch (error) {
    console.debug('Generating website with eleventy');
    console.debug(error);
  }
  console.log('executed successfully: ' + command);
};
module.exports = launchEleventy;
