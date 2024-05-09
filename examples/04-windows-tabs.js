const { goto, click, title, closeTab, currentURL, text } = require('taiko'),
  path = require('path'),
  { openBrowserAndStartScreencast, closeBrowserAndStopScreencast } = require('./browser/launcher'),
  expect = require('chai').expect;

(async () => {
  try {
    const url = 'http://localhost:3000/windows';
    await openBrowserAndStartScreencast(path.join('captures', 'windows', 'windows.gif'));
    let options = {
      navigationTimeout: 40000,
      waitForNavigation: true,
      waitForEvents: ['firstMeaningfulPaint', 'DOMContentLoaded'],
    };
    await goto(url, options);
    await click('click here');
    expect(await title()).to.eq('The Internet Express');
    await closeTab();
    expect(await currentURL()).to.eq(url);
    expect(await text('Opening a new Window').exists()).to.be.true;
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await closeBrowserAndStopScreencast();
  }
})();
