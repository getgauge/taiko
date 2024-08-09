const expect = require("chai").expect;
const { EventEmitter } = require("events");
const rewire = require("rewire");
const { fail } = require("assert");

describe("openTab", () => {
  let actualTarget, actualOptions, actualUrl, taiko;
  const target = "TARGET";

  before(async () => {
    taiko = rewire("../../lib/taiko");

    const mockConnectToCri = (tgt) => {
      actualTarget = tgt;
    };
    const targetRegistry = new Map();
    const mockWrapper = async (options, cb) => {
      actualOptions = options;
      await cb();
    };
    taiko.__set__("validate", () => {});
    taiko.__set__("targetHandler", {
      createTarget: async (url) => {
        actualUrl = url;
        return target;
      },
      register: (name, target) => {
        if (name && target) {
          targetRegistry.set(name, target);
        } else {
          return targetRegistry.get(name);
        }
      },
      unregister: (name) => {
        targetRegistry.delete(name);
      },
      clearRegister: () => {
        targetRegistry.clear();
      },
    });
    taiko.__set__("doActionAwaitingNavigation", mockWrapper);
    taiko.__set__("connect_to_cri", mockConnectToCri);
    taiko.__set__("cleanUpListenersOnClient", () => {});
  });

  after(() => {
    taiko = rewire("../../lib/taiko");
  });

  afterEach(() => {
    taiko.__get__("targetHandler").clearRegister();
  });

  it("Open tab without any url should call connectToCri", async () => {
    await taiko.openTab();
    expect(actualTarget).to.deep.equal(target);
  });

  it("Should not alter the url if protocol is given", async () => {
    let expectedUrl = "http://gauge.org";
    await taiko.openTab(expectedUrl);
    expect(actualUrl).to.equal(expectedUrl);

    expectedUrl = "file://example.com";
    await taiko.openTab(expectedUrl);
    expect(actualUrl).to.equal(expectedUrl);

    expectedUrl = "chrome-extension://gjaerjgaerjeoareapoj/internalPage.html";
    await taiko.openTab(expectedUrl);
    expect(actualUrl).to.equal(expectedUrl);
  });

  it("should add protocol http:// if not given", async () => {
    const expectedUrl = "gauge.org";
    await taiko.openTab(expectedUrl);
    expect(actualUrl).to.equal("http://" + expectedUrl);
  });

  it("should call doActionAwaitingNavigation with default options if options not given", async () => {
    const expectedOptions = {
      navigationTimeout: 30000,
      waitForNavigation: true,
      waitForStart: 100,
      waitForEvents: [],
    };
    await taiko.openTab("example.com");
    expect(actualOptions).to.deep.equal(expectedOptions);
  });

  it("should call doActionAwaitingNavigation with given options", async () => {
    const expectedOptions = {
      navigationTimeout: 40000,
      waitForNavigation: false,
      waitForEvents: ["firstMeaningfulPaint"],
    };
    await taiko.openTab("example.com", expectedOptions);
    expect(actualOptions).to.deep.equal(expectedOptions);
  });

  it("should throw error if tab is opened with same identifier more than once", async () => {
    await taiko.openTab("example.com", { name: "example" });
    try {
      await taiko.openTab("anotherexamplecom", { name: "example" });
      fail("Did not throw error on duplicate name registration");
    } catch (err) {
      expect(err.message).to.equal(
        "There is a window or tab already registered with the name 'example' please use another name.",
      );
    }
  });

  it("should register with identifier if no url and an identifier is passed", async () => {
    await taiko.openTab({ name: "github" });
    expect(actualOptions.name).to.equal("github");
    expect(taiko.__get__("targetHandler").register("github")).to.equal(target);
  });

  it("should set about:blank as the url with identifier", async () => {
    await taiko.openTab({ name: "github" });
    expect(actualUrl).to.equal("about:blank");
  });

  it("should set about:blank when no parameters are passed", async () => {
    await taiko.openTab();
    expect(actualUrl).to.equal("about:blank");
  });
});
