const { goto, text } = require('taiko'),
  path = require('path'),
  { openBrowserAndStartScreencast, closeBrowserAndStopScreencast } = require('./browser/launcher'),
  expect = require('chai').expect;

(async () => {
  try {
    await openBrowserAndStartScreencast(path.join('captures', 'frames', 'frames.gif'));
    await goto('http://localhost:3000/nested_frames');
    expect(await text('MIDDLE').exists(), 'expected "MIDDLE" to exist on page').to.be.true;
    // taiko does not need to be told about frames, it automagically figures it out.

    //TODO: tinyMCE example
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await closeBrowserAndStopScreencast();
  }
})();
