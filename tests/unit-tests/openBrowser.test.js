const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;

chai.use(chaiAsPromised);

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
    it("openBrowser should throw an error when options parameter is string", async () => {
      await expect(openBrowser("someString")).to.eventually.be.rejectedWith(Error);
    });

    it("openBrowser should throw an error when options parameter is array", async () => {
      await expect(openBrowser([])).to.eventually.be.rejectedWith(Error);
    });
  });

  describe("when browser is already open", () => {
    afterEach(async () => {
      try {
        await closeBrowser();
      } catch (_) {
        // ignore — browser may not have opened successfully
      }
    });

    it("openBrowser should throw error when called before closeBrowser", async () => {
      await openBrowser(openBrowserArgs);
      await expect(openBrowser(openBrowserArgs)).to.eventually.be.rejectedWith(Error);
    });
  });
});
