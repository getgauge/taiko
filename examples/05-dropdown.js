const { goto, dropDown } = require('taiko'),
  path = require('path'),
  { openBrowserAndStartScreencast, closeBrowserAndStopScreencast } = require('./browser/launcher'),
  expect = require('chai').expect;

(async () => {
  try {
    await openBrowserAndStartScreencast(path.join('captures', 'dropdown', 'dropdown.gif'));
    await goto('http://localhost:3000/dropdown');
    expect(await dropDown().exists()).to.be.true;
    await dropDown().select('Option 1');
    expect(await dropDown().value()).to.eq('1');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await closeBrowserAndStopScreencast();
  }
})();
