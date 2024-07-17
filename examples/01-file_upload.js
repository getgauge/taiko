const { goto, fileField, button, above, attach, click, text } = require('taiko'),
  path = require('path'),
  { openBrowserAndStartScreencast, closeBrowserAndStopScreencast } = require('./browser/launcher'),
  expect = require('chai').expect;

(async () => {
  try {
    await openBrowserAndStartScreencast(path.join('captures', 'file-upload', 'file-upload.gif'));
    await goto('http://localhost:3000/upload');
    await attach(path.join(__dirname, 'data', 'foo.txt'), fileField(above(button('Upload'))));
    await click('Upload');
    var exists = await text('file uploaded!').exists();
    expect(exists).to.be.true;
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await closeBrowserAndStopScreencast();
  }
})();
