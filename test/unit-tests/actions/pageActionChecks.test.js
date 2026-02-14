const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const rewire = require("rewire");
let pageActionChecks = rewire("../../../lib/actions/pageActionChecks");

describe("pageActionChecks", () => {
  describe("checkVisible", () => {
    beforeEach(() => {
      pageActionChecks.__set__("defaultConfig", {
        retryInterval: 0,
        retryTimeout: 0,
      });
    });
    afterEach(() => {
      pageActionChecks = rewire("../../../lib/actions/pageActionChecks");
    });
    it("should call elements isVisible method and return result", async () => {
      const elem = { isVisible: () => true };
      const result = await pageActionChecks.__get__("checkVisible")(elem);
      expect(result).to.be.true;
    });
  });
  describe("checkNotDisabled", () => {
    beforeEach(() => {
      pageActionChecks.__set__("defaultConfig", {
        retryInterval: 0,
        retryTimeout: 0,
      });
    });
    afterEach(() => {
      pageActionChecks = rewire("../../../lib/actions/pageActionChecks");
    });
    it("should call elements isDisabled method and return not of result", async () => {
      const elem = { isDisabled: () => false };
      const result = await pageActionChecks.__get__("checkNotDisabled")(elem);
      expect(result).to.be.true;
    });
  });
  describe("checkIfActionable", () => {
    beforeEach(() => {
      pageActionChecks.__set__("defaultConfig", {
        retryInterval: 0,
        retryTimeout: 0,
      });
    });
    afterEach(() => {
      pageActionChecks = rewire("../../../lib/actions/pageActionChecks");
    });
    it("should check all given checks and return false if anyone is false", async () => {
      const checks = [
        pageActionChecks.checksMap.visible,
        pageActionChecks.checksMap.disabled,
      ];
      const elem = { isVisible: () => true, isDisabled: () => true };
      const result = await pageActionChecks.__get__("checkIfActionable")(
        elem,
        checks,
      );
      expect(result.actionable).to.be.false;
    });
    it("should check all given checks and return true if all are true", async () => {
      const checks = [
        pageActionChecks.checksMap.visible,
        pageActionChecks.checksMap.disabled,
      ];
      const elem = { isVisible: () => true, isDisabled: () => false };
      const result = await pageActionChecks.__get__("checkIfActionable")(
        elem,
        checks,
      );
      expect(result.actionable).to.be.true;
    });
  });
  describe("waitAndGetActionableElement", () => {
    beforeEach(() => {
      pageActionChecks.__set__("scrollToElement", () => {});
      pageActionChecks.__set__("defaultConfig", {
        noOfElementToMatch: 2,
        retryInterval: 5,
        retryTimeout: 10,
      });
    });
    afterEach(() => {
      pageActionChecks = rewire("../../../lib/actions/pageActionChecks");
    });
    it("should call checkActionable with default checks if not given", async () => {
      const defaultChecks = [
        pageActionChecks.checksMap.visible,
        pageActionChecks.checksMap.disabled,
        pageActionChecks.checksMap.connected,
        pageActionChecks.checksMap.stable,
      ];
      let actualCheck;
      pageActionChecks.__set__("checkIfActionable", (elem, checks) => {
        actualCheck = checks;
        return { actionable: true, error: null };
      });
      pageActionChecks.__set__("findElements", () => [
        { isVisible: () => true, isDisabled: () => false },
      ]);
      await pageActionChecks.waitAndGetActionableElement("Something");
      expect(actualCheck).to.deep.equal(defaultChecks);
    });
    it("should call checkActionable with given checks concatinated with default checks", async () => {
      const expectedChecks = [
        pageActionChecks.checksMap.visible,
        pageActionChecks.checksMap.connected,
        pageActionChecks.checksMap.disabled,
        pageActionChecks.checksMap.stable,
        pageActionChecks.checksMap.writable,
      ];
      let actualCheck;
      pageActionChecks.__set__("checkIfActionable", (elem, checks) => {
        actualCheck = checks;
        return { actionable: true, error: null };
      });
      pageActionChecks.__set__("findElements", () => [
        { isVisible: () => true, isDisabled: () => false },
      ]);
      await pageActionChecks.waitAndGetActionableElement("Something", false, [
        pageActionChecks.checksMap.writable,
      ]);
      expect(actualCheck).to.have.members(expectedChecks);
    });
    it("should return first element that is actionable", async () => {
      pageActionChecks.__set__("runtimeHandler", {
        runtimeCallFunctionOn: (a, b, c) => {
          return { result: { value: true } };
        },
      });
      pageActionChecks.__set__("findElements", () => [
        {
          name: "notActionable",
          get: () => 1,
          isVisible: () => true,
          isDisabled: () => true,
          isConnected: () => true,
        },
        {
          name: "Actionable",
          get: () => 2,
          isVisible: () => true,
          isDisabled: () => false,
          isConnected: () => true,
        },
      ]);
      const result =
        await pageActionChecks.waitAndGetActionableElement("Something");
      expect(result.name).to.equal("Actionable");
    });
    it("should throw error when no actionable element is found in default number of element to check", async () => {
      pageActionChecks.__set__("findElements", () => [
        {
          name: "notActionable",
          isVisible: () => true,
          isDisabled: () => true,
        },
        {
          name: "notActionable",
          isVisible: () => true,
          isDisabled: () => true,
        },
        {
          name: "notActionable",
          isVisible: () => true,
          isDisabled: () => false,
        },
      ]);
      await expect(
        pageActionChecks.waitAndGetActionableElement("Something"),
      ).to.be.eventually.rejectedWith(
        "Found too many matches. Please use a selector that is more specific",
      );
    });
    it("should throw error when no actionable element is found and force false", async () => {
      pageActionChecks.__set__("findElements", () => [
        {
          name: "notActionable",
          isVisible: () => true,
          isDisabled: () => true,
        },
        {
          name: "notActionable",
          isVisible: () => true,
          isDisabled: () => true,
        },
      ]);
      await expect(
        pageActionChecks.waitAndGetActionableElement("Something"),
      ).to.be.eventually.rejectedWith(
        'Element matching text "Something" is disabled',
      );
    });
    it("should retrun the first element if no match is found and force true", async () => {
      pageActionChecks.__set__("findElements", () => [
        {
          name: "notActionable1",
          isVisible: () => true,
          isDisabled: () => true,
        },
        {
          name: "notActionable2",
          isVisible: () => true,
          isDisabled: () => true,
        },
      ]);
      const result = await pageActionChecks.waitAndGetActionableElement(
        "Something",
        true,
      );
      expect(result.name).to.equal("notActionable1");
    });
  });
});
