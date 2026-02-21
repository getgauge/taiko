const chai = require("chai");
const expect = chai.expect;
const rewire = require("rewire");

const { openBrowserArgs } = require("./test-util");
describe("OpenBrowser", () => {
  let taiko;
  let openBrowser;
  let closeBrowser;
  before(() => {
    taiko = rewire("taiko/lib/taiko");
    openBrowser = taiko.openBrowser;
    closeBrowser = taiko.closeBrowser;
  });
  after(() => {
    taiko = rewire("taiko/lib/taiko");
  });
  describe("throws an error", () => {
    it("openBrowser should throw an error when options parameter is string", async () =>
      await openBrowser("someString").catch((error) =>
        expect(error).to.be.an.instanceOf(Error),
      ));
    it("openBrowser should throw an error when options parameter is array", async () =>
      await openBrowser([]).catch((error) =>
        expect(error).to.be.an.instanceOf(Error),
      ));

    it("openBrowser should throw error, when it is called before closeBrowser is called", async () => {
      await openBrowser(openBrowserArgs);
      await openBrowser(openBrowserArgs).catch((error) =>
        expect(error).to.be.an.instanceOf(Error),
      );
      await closeBrowser();
    });
  });
});
