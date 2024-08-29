const path = require("node:path");
const { writeFileSync, unlinkSync, existsSync } = require("node:fs");
const { pathToFileURL, fileURLToPath } = require("node:url");
const { setConfig } = require("../../lib/taiko");

module.exports.createHtml = (innerHtml, testName) => {
  const htmlFilePath = path.join(
    process.cwd(),
    "test",
    "unit-tests",
    "data",
    `${testName}.html`,
  );
  const content = `
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
  let _filePath = filePath;
  try {
    _filePath = fileURLToPath(filePath);
  } catch (e) {
  } finally {
    if (existsSync(_filePath)) {
      unlinkSync(_filePath);
    }
  }
};

module.exports.openBrowserArgs = {
  args: [
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-setuid-sandbox",
    "--no-first-run",
    "--no-sandbox",
    "--no-zygote",
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
