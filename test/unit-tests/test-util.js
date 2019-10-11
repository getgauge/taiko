let path = require('path');
let { writeFileSync, unlinkSync } = require('fs');
let { emitter } = require('../../lib/taiko');
let { pathToFileURL, fileURLToPath } = require('url');

emitter.on('success', desc => console.log(desc));
module.exports.createHtml = (innerHtml, testName) => {
  let htmlFilePath = path.join(
    process.cwd(),
    'test',
    'unit-tests',
    'data',
    testName + '.html',
  );
  let content = `
<!DOCTYPE html>
<html>
    <head>
        <title>${testName}</title>
    </head>
    <body>
        ${innerHtml}
    </body>
</html>
    `;
  writeFileSync(htmlFilePath, content);
  return pathToFileURL(htmlFilePath).toString();
};

module.exports.removeFile = filePath => {
  try {
    filePath = fileURLToPath(filePath);
  } catch (e) {
  } finally {
    unlinkSync(filePath);
  }
};

module.exports.openBrowserArgs = {
  args: [
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
  ],
};
