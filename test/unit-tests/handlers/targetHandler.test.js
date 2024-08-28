const expect = require("chai").expect;
const rewire = require("rewire");

describe("TargetHandler", () => {
  describe(".getCriTargets", () => {
    let _targets = [];
    let targetHandler;

    before(() => {
      targetHandler = rewire("../../../lib/handlers/targetHandler");
      const mockCri = () => {
        return {
          Target: {
            getTargets: () => {
              return { targetInfos: _targets };
            },
          },
        };
      };
      targetHandler.__set__("cri", mockCri);
    });

    after(() => {
      const createdSessionListener = targetHandler.__get__(
        "createdSessionListener",
      );
      targetHandler
        .__get__("eventHandler")
        .removeListener("createdSession", createdSessionListener);
      targetHandler = rewire("../../../lib/handlers/targetHandler");
      targetHandler
        .__get__("eventHandler")
        .removeListener(
          "createdSession",
          targetHandler.__get__("createdSessionListener"),
        );
    });

    beforeEach(() => {
      _targets = [];
    });
    it("should give current tab as matching if no url given", async () => {
      _targets.push({ targetId: "1", type: "page" });
      _targets.push({ targetId: "2", type: "page" });
      targetHandler.__set__("activeTargetId", "2");
      const targets = await targetHandler.getCriTargets();
      expect(targets.matching.length).to.be.equal(1);
      expect(targets.matching[0].targetId).to.be.equal("2");
      expect(targets.others.length).to.be.equal(1);
      expect(targets.others[0].targetId).to.be.equal("1");
    });

    it("should create target and return target id on createTarget call", async () => {
      targetHandler.__set__("browserDebugUrlTarget", {
        createTarget: async () => {
          return { targetId: "id1" };
        },
      });
      const actualTargetId = await targetHandler.createTarget("url");
      expect(actualTargetId).to.equal("id1");
    });

    it("should give all the matching tabs if regex is given", async () => {
      _targets.push({
        targetId: "1",
        type: "page",
        url: "https://www.google.com",
        title: "Google",
      });
      _targets.push({
        targetId: "1",
        type: "page",
        url: "https://www.google.co.uk",
        title: "Google",
      });
      _targets.push({
        targetId: "1",
        type: "page",
        url: "https://www.github.com",
        title: "The world’s leading software development platform · GitHub",
      });

      const targets = await targetHandler.getCriTargets(
        /http(s?):\/\/(www?).google.(com|co.in|co.uk)/,
      );

      expect(targets.matching.length).to.be.equal(2);

      const someOtherTarget = await targetHandler.getCriTargets(/Go*gle/);

      expect(someOtherTarget.matching.length).to.be.equal(2);
    });

    it("should give all matching tabs if url is given without protocol ", async () => {
      _targets.push({
        targetId: "1",
        type: "page",
        url: "https://flipkart.com/a/c",
      });
      _targets.push({
        targetId: "2",
        type: "page",
        url: "https://amazon.com",
      });
      _targets.push({
        targetId: "3",
        type: "page",
        url: "https://flipkart.com/a/b",
      });

      const targets = await targetHandler.getCriTargets("flipkart.com/a/b");

      expect(targets.matching.length).to.be.equal(1);
      expect(targets.matching[0].targetId).to.be.equal("3");
      expect(targets.matching[0].url).to.be.equal("https://flipkart.com/a/b");
      expect(targets.others.length).to.be.equal(2);
      expect(targets.others[0].url).to.be.equal("https://flipkart.com/a/c");
    });

    it("should give all matching tabs if url is given with multi path ", async () => {
      _targets.push({
        targetId: "1",
        type: "page",
        url: "https://flipkart.com/a/c",
      });
      _targets.push({
        targetId: "2",
        type: "page",
        url: "https://amazon.com",
      });
      _targets.push({
        targetId: "3",
        type: "page",
        url: "https://flipkart.com/a/b",
      });

      const targets = await targetHandler.getCriTargets(
        "https://flipkart.com/a/b",
      );

      expect(targets.matching.length).to.be.equal(1);
      expect(targets.matching[0].targetId).to.be.equal("3");
      expect(targets.matching[0].url).to.be.equal("https://flipkart.com/a/b");
      expect(targets.others.length).to.be.equal(2);
      expect(targets.others[0].url).to.be.equal("https://flipkart.com/a/c");
    });

    it("should give all matching tabs if host is given", async () => {
      _targets.push({
        targetId: "1",
        type: "page",
        url: "https://flipkart.com",
      });
      _targets.push({
        targetId: "2",
        type: "page",
        url: "https://amazon.com",
      });
      _targets.push({
        targetId: "3",
        type: "page",
        url: "https://flipkart.com",
      });

      const targets = await targetHandler.getCriTargets("flipkart.com");

      expect(targets.matching.length).to.be.equal(2);
      expect(targets.matching[0].targetId).to.be.equal("1");
      expect(targets.matching[0].url).to.be.equal("https://flipkart.com");
      expect(targets.others.length).to.be.equal(1);
      expect(targets.others[0].url).to.be.equal("https://amazon.com");
    });

    it("should give no matching tabs if given url does not exists", async () => {
      _targets.push({
        targetId: "1",
        type: "page",
        url: "https://flipkart.com",
      });
      _targets.push({
        targetId: "2",
        type: "page",
        url: "https://amazon.com",
      });
      _targets.push({
        targetId: "3",
        type: "page",
        url: "https://flipkart.com",
      });

      const targets = await targetHandler.getCriTargets("gauge.org");

      expect(targets.matching.length).to.be.equal(0);
      expect(targets.others.length).to.be.equal(3);
    });
    it("should give the matching tab for regex Title", async () => {
      _targets.push({
        targetId: "1",
        type: "page",
        url: "https://google.com",
        title: "Google",
      });
      _targets.push({
        targetId: "2",
        type: "page",
        url: "https://github.com",
        title: "The world’s leading software development platform · GitHub",
      });
      const targets = await targetHandler.getCriTargets(/Go*gle/);
      expect(targets.matching.length).to.be.equal(1);
      expect(targets.others.length).to.be.equal(1);
    });

    it("should give all matching tabs if targets has blank page", async () => {
      _targets.push({
        targetId: "1",
        type: "page",
        url: "http://localhost:3001/windows",
      });
      _targets.push({
        targetId: "2",
        type: "page",
        url: "http://localhost:3001/windows/new",
      });
      _targets.push({
        targetId: "3",
        type: "page",
        url: "about:blank",
      });
      const targets = await targetHandler.getCriTargets(
        "http://localhost:3001/windows",
      );

      expect(targets.matching.length).to.be.equal(1);
      expect(targets.matching[0].targetId).to.be.equal("1");
      expect(targets.others.length).to.be.equal(2);
    });
  });

  describe("register and unregister", () => {
    let targetHandler;

    beforeEach(() => {
      targetHandler = rewire("../../../lib/handlers/targetHandler");
    });

    afterEach(() => {
      targetHandler.clearRegister();
    });

    it("should register a target with name", async () => {
      targetHandler.register("one", { targetId: "first", type: "page" });
      targetHandler.register("two", { targetId: "second", type: "page" });
      expect(targetHandler.register("two").targetId).to.be.equal("second");
    });

    it("should unregister a tab with the given name", async () => {
      targetHandler.register("one", { targetId: "first", type: "page" });
      targetHandler.register("two", { targetId: "second", type: "page" });

      targetHandler.unregister("one");

      expect(targetHandler.register("one")).to.be.undefined;
      expect(targetHandler.register("two").targetId).to.equal("second");
    });

    it("should register a browser context id with a target id", async () => {
      const target = { targetId: "first", type: "page" };

      targetHandler.__set__("activeBrowserContextId", "4");
      targetHandler.register("one", target);

      const browserRegistry = targetHandler.__get__("browserRegistry");

      expect(browserRegistry.get(target)).to.be.equal("4");
    });

    it("should unregister the browser context id with the given target", async () => {
      const target = { targetId: "first", type: "page" };

      targetHandler.__set__("activeBrowserContextId", "4");
      targetHandler.register("one", target);

      targetHandler.unregister("one");

      const browserRegistry = targetHandler.__get__("browserRegistry");

      expect(browserRegistry.get(target)).to.be.undefined;
    });
  });
});
