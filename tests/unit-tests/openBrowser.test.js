const chai = require("chai");
const expect = chai.expect;

const { openBrowserArgs } = require("./test-util");
describe("OpenBrowser", () => {
  let taiko;
  let openBrowser;
  let closeBrowser;
  before(() => {
    taiko = require("taiko/lib/taiko");
    taiko.__reset__();
    openBrowser = taiko.openBrowser;
    closeBrowser = taiko.closeBrowser;
  });
  after(() => {
    taiko.__reset__();
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
