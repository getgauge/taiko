const {
    goto,
    click,
    title,
    closeTab,
    currentURL,
    text,
  } = require('taiko'),
  path = require('path'),
  {
    openBrowserAndStartScreencast,
    closeBrowserAndStopScreencast,
  } = require('./browserLauncher'),
  expect = require('chai').expect;

(async () => {
  try {
    const url = 'http://localhost:3000/windows';
    await openBrowserAndStartScreencast(
      path.join('captures', 'windows', 'windows.gif'),
    );
    await goto(url);
    await click('click here');
    expect(await title()).to.eq('New Window');
    await closeTab();
    expect(await currentURL()).to.eq(url);
    expect(await text('Opening a new Window').exists()).to.be.true;
  } catch (e) {
    console.error(e);
  } finally {
    await closeBrowserAndStopScreencast();
  }
})();
