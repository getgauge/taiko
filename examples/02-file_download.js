const { goto, client, click } = require('taiko'),
  path = require('path'),
  fs = require('fs'),
  { openBrowserAndStartScreencast, closeBrowserAndStopScreencast } = require('./browser/launcher'),
  expect = require('chai').expect;

(async () => {
  var downloadPath = path.resolve(__dirname, 'data', 'downloaded');
  var sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };
  try {
    await openBrowserAndStartScreencast(
      path.join('captures', 'file-download', 'file-download.gif'),
    );
    await client().send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloadPath,
    });
    await goto('http://localhost:3000/download');

    // ensure that file_upload.js is run before this, to allow the file to be available for download
    await click('foo.txt');
    sleep(1000);
    expect(path.join(downloadPath, 'foo.txt')).to.exist;
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await closeBrowserAndStopScreencast();
    if (fs.existsSync(path.join(downloadPath, 'foo.txt'))) {
      fs.unlinkSync(path.join(downloadPath, 'foo.txt'));
    }
  }
})();
