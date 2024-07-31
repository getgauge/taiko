const { goto, click, text } = require("taiko"),
  path = require("path"),
  {
    openBrowserAndStartScreencast,
    closeBrowserAndStopScreencast,
  } = require("./browser/launcher"),
  expect = require("chai").expect;

(async () => {
  try {
    // example 1
    await openBrowserAndStartScreencast(
      path.join("captures", "dynamic-pages", "dynamic-pages.gif"),
    );
    await goto("http://localhost:3000/dynamic_loading");
    await click("Example 1:");
    await click("Start");
    // no waits, taiko implicitly listens and waits for the right state.
    expect(await text("Hello World").exists()).to.be.true;

    // example 2
    await goto("http://localhost:3000/dynamic_loading");
    await click("Example 2:");
    await click("Start");
    expect(await text("Hello World").exists()).to.be.true;
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await closeBrowserAndStopScreencast();
  }
})();
