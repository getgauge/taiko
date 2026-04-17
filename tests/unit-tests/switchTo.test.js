const chai = require("chai");
const expect = require("chai").expect;
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

describe("switchTo", () => {
  let taiko;
  let registeredTarget;
  let baseTargetHandler;

  before(async () => {
    taiko = require("taiko/lib/taiko");
    taiko.__reset__();
    const targetRegistry = new Map();
    taiko.__set__("validate", () => {});
    baseTargetHandler = {
      getCriTargets: () => {
        return { matching: [] };
      },
      register: (name, target) => {
        if (name && target) {
          targetRegistry.set(name, target);
          return;
        }
        return registeredTarget ?? targetRegistry.get(name);
      },
      switchBrowserContext: () => {},
    };
    taiko.__set__("targetHandler", baseTargetHandler);
    taiko.__set__("connect_to_cri", () => {
      return registeredTarget;
    });
  });

  after(() => {
    taiko.__reset__();
  });

  afterEach(() => {
    // Restore the baseline targetHandler in case a test overrode it
    taiko.__set__("targetHandler", baseTargetHandler);
  });

  const invalidInputCases = [
    {
      label: "no url specified",
      input: undefined,
      expectedMsg:
        'The "targetUrl" argument must be of type string, regex or identifier. Received type undefined',
    },
    {
      label: "empty string",
      input: "",
      expectedMsg:
        "Cannot switch to tab or window as the targetUrl is empty. Please use a valid string, regex or identifier",
    },
    {
      label: "whitespace-only string",
      input: "  ",
      expectedMsg:
        "Cannot switch to tab or window as the targetUrl is empty. Please use a valid string, regex or identifier",
    },
  ];

  for (const { label, input, expectedMsg } of invalidInputCases) {
    it(`should throw error when ${label}`, async () => {
      await expect(taiko.switchTo(input)).to.eventually.be.rejectedWith(
        expectedMsg,
      );
    });
  }

  it("should accept regex and call targetHandler with RegExp", async () => {
    let capturedArg;
    taiko.__set__("targetHandler", {
      getCriTargets: (arg) => {
        capturedArg = arg;
        return { matching: [] };
      },
      register: () => {},
      switchBrowserContext: () => {},
    });
    const pattern = /http(s):\/\/www.google.com/;
    await taiko.switchTo(pattern).catch(() => {});
    expect(capturedArg, "targetHandler should be called with the regex").to.deep.equal(pattern);
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
