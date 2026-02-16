const chai = require("chai");
const expect = chai.expect;
const util = require("node:util");
const { openBrowser, closeBrowser, client } = require("taiko");

const { openBrowserArgs } = require("./test-util");

describe("CDP domain proxies", () => {
  beforeEach(async () => {
    await openBrowser(openBrowserArgs);
  });
  afterEach(async () => {
    await closeBrowser();
  });

  it("should create prxy for CDP domains", () => {
    const cdpDomains = [
      "Page",
      "Network",
      "Runtime",
      "Input",
      "DOM",
      "Overlay",
      "Security",
    ];
    const cdpClient = client();
    for (const iterator of cdpDomains) {
      expect(util.types.isProxy(cdpClient[iterator])).to.be.true;
    }
  });
});
