const expect = require("chai").expect;
const { EventEmitter } = require("node:events");
const rewire = require("rewire");

describe("closeTab", () => {
  let _targets = { matching: [], others: [] };
  let currentURL = "";
  let title = "";
  let _isMatchUrl = false;
  let _isMatchRegex = false;
  const _isMatchTarget = false;

  let currentTarget;
  let taiko;
  let targetHandler;
  const descEmmitter = new EventEmitter();

  const validateEmitterEvent = (event, expectedText) =>
    new Promise((resolve) => {
      descEmmitter.on(event, (eventData) => {
        expect(eventData).to.be.equal(expectedText);
        resolve();
      });
    });

  before(() => {
    taiko = rewire("taiko/lib/taiko");
    const targetRegistry = new Map();
    const mockHandler = {
      closeTarget: () => {},
      getCriTargets: () => {
        return _targets;
      },
      constructCriTarget: (arg) => {
        return arg;
      },
      isMatchingUrl: () => {
        return _isMatchUrl;
      },
      isMatchingRegex: () => {
        return _isMatchRegex;
      },
      isMatchingTarget: () => {
        return _isMatchTarget;
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
    };

    taiko.__set__("validate", () => {});
    taiko.__set__("currentURL", () => currentURL);
    taiko.__set__("title", () => title);
    taiko.__set__("targetHandler", mockHandler);
    taiko.__set__("descEvent", descEmmitter);
    taiko.__set__("connect_to_cri", async (target) => {
      currentTarget = target;
      return currentTarget;
    });
    taiko.__set__("dom", { getDocument: async () => {} });
  });

  after(() => {
    taiko = rewire("taiko/lib/taiko");
  });

  beforeEach(() => {
    descEmmitter.removeAllListeners();
    taiko.__set__("cleanUpListenersOnClient", () => {});
    _targets = { matching: [], others: [] };
    currentTarget = undefined;
  });

  it("should close the browser if there are no tabs to reconnect", async () => {
    taiko.__set__("_closeBrowser", () => {});
    const validatePromise = validateEmitterEvent(
      "success",
      "Closing last target and browser.",
    );
    await taiko.closeTab();
    await validatePromise;
  });

  it("should close the current tab and switch to last active target if no url given", async () => {
    _targets.matching.push({
      targetId: "1",
      type: "page",
      url: "https://flipkart.com",
    });
    _targets.others.push({
      targetId: "2",
      type: "page",
      url: "https://flipkart.com",
    });
    _targets.others.push({
      targetId: "3",
      type: "page",
      url: "https://amazon.com",
    });
    currentURL = "https://amazon.com";
    _isMatchUrl = false;
    _isMatchRegex = false;
    const validatePromise = validateEmitterEvent(
      "success",
      "Closed current tab matching https://flipkart.com",
    );
    await taiko.closeTab();
    await validatePromise;
    expect(currentTarget).to.be.eql("2");
  });

  it("should close the all matching tabs with given url switch to last active", async () => {
    _targets.matching.push({
      targetId: "1",
      type: "page",
      url: "https://flipkart.com",
    });
    _targets.others.push({
      targetId: "2",
      type: "page",
      url: "https://amazon.com",
    });
    _targets.matching.push({
      targetId: "3",
      type: "page",
      url: "https://flipkart.com",
    });
    currentURL = "https://flipkart.com";
    _isMatchUrl = true;
    _isMatchRegex = false;

    const validatePromise = validateEmitterEvent(
      "success",
      "Closed tab(s) matching https://flipkart.com",
    );
    await taiko.closeTab("https://flipkart.com");
    await validatePromise;
    expect(currentTarget).to.be.eql("2");
  });
  it("should close all matching tabs if target is non active tab and no reconnect should happen", async () => {
    _targets.matching.push({
      targetId: "1",
      type: "page",
      url: "https://flipkart.com",
    });
    _targets.matching.push({
      targetId: "2",
      type: "page",
      url: "https://flipkart.com",
    });
    _targets.others.push({
      targetId: "3",
      type: "page",
      url: "https://amazon.com",
    });
    currentURL = "https://amazon.com";
    _isMatchUrl = false;
    _isMatchRegex = false;

    const validatePromise = validateEmitterEvent(
      "success",
      "Closed tab(s) matching https://flipkart.com",
    );
    await taiko.closeTab("https://flipkart.com");
    await validatePromise;
    expect(currentTarget).to.be.undefined;
  });
  it("should close all matching tabs by title and no reconnect should happen if active tab is not matched", async () => {
    _targets.matching.push({
      targetId: "1",
      type: "page",
      title: "Flipkart",
      url: "https://flipkart.com",
    });
    _targets.matching.push({
      targetId: "2",
      type: "page",
      title: "Flipkart",
      url: "https://flipkart.com",
    });
    _targets.others.push({
      targetId: "3",
      type: "page",
      url: "https://amazon.com",
    });
    currentURL = "https://amazon.com";
    title = "Amazon";
    _isMatchUrl = false;
    _isMatchRegex = false;

    const validatePromise = validateEmitterEvent(
      "success",
      "Closed tab(s) matching Flipkart",
    );
    await taiko.closeTab("Flipkart");
    await validatePromise;
    expect(currentTarget).to.be.undefined;
  });
  it("should close all matching tabs for given regex", async () => {
    _targets.matching.push({
      targetId: "1",
      type: "page",
      url: "https://www.google.com",
    });
    _targets.matching.push({
      targetId: "2",
      type: "page",
      url: "https://www.google.co.uk",
    });
    _targets.others.push({
      targetId: "3",
      type: "page",
      url: "https://amazon.com",
    });
    currentURL = "https://amazon.com";
    _isMatchUrl = false;
    _isMatchRegex = false;

    const validatePromise = validateEmitterEvent(
      "success",
      "Closed tab(s) matching /http(s?):\\/\\/(www?).google.(com|co.in|co.uk)/",
    );
    await taiko.closeTab(/http(s?):\/\/(www?).google.(com|co.in|co.uk)/);
    await validatePromise;
    expect(currentTarget).to.be.undefined;
  });

  it("should close tab matching identifier", async () => {
    const targetWithIdentifier = {
      targetId: "1",
      type: "page",
      url: "https://www.google.com",
    };

    _targets.matching.push(targetWithIdentifier);

    taiko.__get__("targetHandler").register("google", targetWithIdentifier);

    _targets.others.push({
      targetId: "2",
      type: "page",
      url: "https://www.google.co.uk",
    });
    _targets.others.push({
      targetId: "3",
      type: "page",
      url: "https://amazon.com",
    });
    currentURL = "https://amazon.com";
    _isMatchUrl = false;
    _isMatchRegex = false;

    const validatePromise = validateEmitterEvent(
      "success",
      "Closed tab(s) matching google",
    );
    await taiko.closeTab({ name: "google" });
    expect(taiko.__get__("targetHandler").register("google")).to.be.undefined;
    await validatePromise;
  });
});
