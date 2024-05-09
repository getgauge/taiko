const expect = require('chai').expect;
let { openBrowser, closeBrowser } = require('../../lib/taiko');
let { openBrowserArgs } = require('./test-util');

describe('close browser successfully', () => {
  before(async () => {
    expect(process.env.TAIKO_EMULATE_DEVICE).to.be.undefined;
    await openBrowser(openBrowserArgs);
  });

  it("closeBrowser should return 'Browser closed' message", async () => {
    await closeBrowser().then((data) => {
      expect(data).to.equal(undefined);
    });
  });
});
