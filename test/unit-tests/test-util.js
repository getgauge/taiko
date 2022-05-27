let path = require('path');
let { writeFileSync, unlinkSync, existsSync } = require('fs');
let { pathToFileURL, fileURLToPath } = require('url');
let { setConfig } = require('../../lib/taiko');

module.exports.createHtml = (innerHtml, testName) => {
  let htmlFilePath = path.join(process.cwd(), 'test', 'unit-tests', 'data', testName + '.html');
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

module.exports.removeFile = (filePath) => {
  try {
    filePath = fileURLToPath(filePath);
  } catch (e) {
  } finally {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
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

module.exports.resetConfig = () => {
  setConfig({
    navigationTimeout: 30000,
    observeTime: 3000,
    retryInterval: 100,
    retryTimeout: 10000,
    observe: false,
    waitForNavigation: true,
    ignoreSSLErrors: true,
    headful: false,
    highlightOnAction: true,
  });
};
