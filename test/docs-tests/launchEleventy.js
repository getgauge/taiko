const { promisify } = require('util');
const Eleventy = require('@11ty/eleventy');

const launchEleventy = async () => {
  try {
    let builder = new Eleventy();
    await builder.init();
  } catch (error) {
    console.debug('Generating website with eleventy');
    console.debug(error);
  }
};
module.exports = launchEleventy;
