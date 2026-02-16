const chai = require("chai");
const expect = chai.expect;
const rewire = require("rewire");
const { openBrowserArgs } = require("./test-util");
const { openBrowser, closeBrowser } = require("taiko");
const { eventHandler } = require("taiko/lib/eventBus");

describe("OpenBrowser", () => {
  let browserLauncher;
  before(() => {
    browserLauncher = rewire("taiko/lib/browser/launcher");
  });
  after(() => {
    browserLauncher = rewire("taiko/lib/browser/launcher");
  });

  describe("should set args", async () => {
    it("from env variable TAIKO_BROWSER_ARGS", async () => {
      process.env.TAIKO_BROWSER_ARGS =
        "--test-arg, --test-arg1,--test-arg2=testArg2zValue1,testArg2zValue2, --test-arg3";
      const setBrowserArgs = browserLauncher.__get__("setBrowserArgs");
      const testArgs = await setBrowserArgs({ args: ["something"] });
      const expectedArgs = [
        "something",
        "--test-arg",
        "--test-arg1",
        "--test-arg2=testArg2zValue1,testArg2zValue2",
        "--test-arg3",
      ];
      expect(testArgs).to.include.members(expectedArgs);
      // biome-ignore lint: Required for testing
      delete process.env.TAIKO_BROWSER_ARGS;
    });
  });

  describe("browser crashes", () => {
    let browserProcess;
    beforeEach(async () => {
      await browserLauncher.launchBrowser(openBrowserArgs);
      browserProcess = browserLauncher.__get__("browserProcess");
    });

    afterEach(() => {
      browserLauncher = rewire("taiko/lib/browser/launcher");
    });

    it("should emit browserCrashed event when chrome process crashes", async () => {
      let browserCrashedEmitted = false;
      eventHandler.on("browserCrashed", () => {
        browserCrashedEmitted = true;
      });
      browserProcess.kill("SIGKILL");
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
      expect(browserCrashedEmitted).to.be.true;
    });

    it("should allow to open a browser after chrome process crashes", async () => {
      browserProcess.kill("SIGKILL");
      await openBrowser(openBrowserArgs);
      await closeBrowser();
    });
  });
});
