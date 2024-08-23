const chai = require("chai");
const expect = require("chai").expect;
const chaiAsPromised = require("chai-as-promised");
const rewire = require("rewire");

chai.use(chaiAsPromised);

describe("switchTo", () => {
  let argument, taiko;
  let registeredTarget;

  before(async () => {
    taiko = rewire("../../lib/taiko");
    taiko.__set__("validate", () => {});
    taiko.__set__("targetHandler.getCriTargets", (arg) => {
      argument = arg;
      return { matching: [] };
    });
    taiko.__set__("targetHandler.register", () => {
      return registeredTarget;
    });
    taiko.__set__("targetHandler.switchBrowserContext", () => {});
    taiko.__set__("connect_to_cri", () => {
      return registeredTarget;
    });
  });

  after(() => {
    taiko = rewire("../../lib/taiko");
  });

  it("should throw error if no url specified", async () => {
    await expect(taiko.switchTo()).to.eventually.rejectedWith(
      'The "targetUrl" argument must be of type string, regex or identifier. Received type undefined',
    );
  });

  it("should throw error if url is empty", async () => {
    await expect(taiko.switchTo("")).to.eventually.rejectedWith(
      "Cannot switch to tab or window as the targetUrl is empty. Please use a valid string, regex or identifier",
    );
  });

  it("should throw error if url is only spaces", async () => {
    await expect(taiko.switchTo("  ")).to.eventually.rejectedWith(
      "Cannot switch to tab or window as the targetUrl is empty. Please use a valid string, regex or identifier",
    );
  });

  it("should accept regex and call targetHandler with RegExp", async () => {
    await expect(
      taiko.switchTo(/http(s):\/\/www.google.com/),
    ).to.eventually.rejectedWith(
      "No tab(s) matching /http(s):\\/\\/www.google.com/ found",
    );
    await expect(argument).to.deep.equal(
      new RegExp(/http(s):\/\/www.google.com/),
    );
  });

  it("should accept window identifier", async () => {
    await expect(taiko.switchTo({ name: "github" })).to.eventually.rejectedWith(
      "Could not find window/tab with name github to switch.",
    );
  });

  it("should switch to tab matching identifier", async () => {
    registeredTarget = {
      id: "github",
    };
    await expect(taiko.switchTo({ name: "github" })).to.eventually.fulfilled;
  });
});
