const { jsDocToJson } = require('./jsDocToJson');

if (!process.env.TAIKO_SKIP_DOCUMENTATION) {
  const sourceFiles = 'lib/taiko.js lib/elementWrapper/*.js';
  const outputFile = 'lib/api.json';
  jsDocToJson(sourceFiles, outputFile);
}
