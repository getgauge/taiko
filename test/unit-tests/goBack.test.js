const { expect } = require("chai");
const rewire = require("rewire");

const test_name = "goBack";

describe(test_name, () => {
  let taiko;
  let actualHistoryEntryId,
    actualOptions = null;

  before(async () => {
    const mockWrapper = async (options, cb) => {
      actualOptions = options;
      await cb();
    };
    taiko = rewire("../../lib/taiko");
    taiko.__set__("doActionAwaitingNavigation", mockWrapper);
    taiko.__set__("validate", () => {});
  });

  after(async () => {
    actualOptions = null;
    taiko = rewire("../../lib/taiko");
  });

  describe("to about blank page", () => {
    before(async () => {
      taiko.__set__("pageHandler", {
        navigateToHistoryEntry: (historyEntryId) => {
          actualHistoryEntryId = { entryId: historyEntryId };
        },
        getNavigationHistory: () => {
          return {
            currentIndex: 1,
            entries: [
              {
                id: 1,
                url: "about:blank",
                userTypedURL: "about:blank",
                title: "",
                transitionType: "typed",
              },
              {
                id: 2,
                url: "https://www.example.com/?gws_rd=ssl",
                userTypedURL: "http://example.com/",
                title: "Example",
                transitionType: "typed",
              },
            ],
          };
        },
      });
    });
    it("should invoke navigateToHistoryEntry with correct history entry id", async () => {
      await taiko.goBack();
      expect(actualHistoryEntryId).to.be.eql({ entryId: 1 });
    });

    it("should set waitForNavigation option to false", async () => {
      await taiko.goBack();
      const expectedOptions = {
        navigationTimeout: 30000,
        waitForStart: 100,
        waitForEvents: [],
        waitForNavigation: false,
      };
      expect(actualOptions).to.be.eql(expectedOptions);
    });

    it("should pass navigation options provided by the user", async () => {
      await taiko.goBack({
        waitForNavigation: true,
        waitForEvents: ["networkIdle"],
        navigationTimeout: 100,
      });
      const expectedOptions = {
        navigationTimeout: 100,
        waitForNavigation: true,
        waitForStart: 100,
        waitForEvents: ["networkIdle"],
      };
      expect(actualOptions).to.be.eql(expectedOptions);
    });
  });
});
