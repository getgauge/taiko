const fs = require('fs');

const jsDocToJson = async (sourceFiles, outputFile) => {
  const documentation = await import('documentation');
  documentation
    .build(sourceFiles, { shallow: true })
    .then(documentation.formats.json)
    .then((output) => {
      // output is a string of JSON data
      fs.writeFileSync(outputFile, output);
    });
};

module.exports.jsDocToJson = jsDocToJson;

/** isRunDirectlyFromTheCommandLine
 *  true - if this module was run directly from the command line as in `node documentation.js`
 *  false - if it is imported by another module
 */
const isRunDirectlyFromTheCommandLine = require.main === module;

if (isRunDirectlyFromTheCommandLine && !process.env.TAIKO_SKIP_DOCUMENTATION) {
  const sourceFiles = ['lib/taiko.js', 'lib/elementWrapper/*.js'];
  const outputFile = 'lib/api.json';
  jsDocToJson(sourceFiles, outputFile);
}
