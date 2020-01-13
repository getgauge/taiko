const { goto, text } = require('taiko'),
  path = require('path'),
  { openBrowserAndStartScreencast, closeBrowserAndStopScreencast } = require('./browserLauncher'),
  expect = require('chai').expect;

(async () => {
  try {
    await openBrowserAndStartScreencast(path.join('captures', 'basic-auth', 'basic-auth.gif'));
    await goto('http://admin:admin@localhost:3000/basic_auth');
    expect(await text('Congratulations! You must have the proper credentials.').exists()).to.be
      .true;
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await closeBrowserAndStopScreencast();
  }
})();
