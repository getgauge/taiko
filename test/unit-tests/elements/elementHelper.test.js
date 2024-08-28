const expect = require("chai").expect;

const rewire = require("rewire");
const Element = require("../../../lib/elements/element");
const { setConfig } = require("../../../lib/config");

describe("elementHelper", () => {
  let boxModel;
  let highlightQuadArgs;
  let hideHighlightCalled;
  let warningMessage;
  let getBoxModelCalled;
  let actualConsole;
  let elemHelper;
  let highlightQuadCalled;
  function createElement(id, isVisible) {
    const elem = new Element(id, "");
    elem.isVisible = () => {
      return isVisible;
    };
    return elem;
  }

  beforeEach(() => {
    elemHelper = rewire("../../../lib/elements/elementHelper");
    boxModel = null;
    highlightQuadArgs = null;
    hideHighlightCalled = false;
    warningMessage = null;
    getBoxModelCalled = false;
    highlightQuadCalled = false;
    elemHelper.__set__("domHandler", {
      getBoxModel: () => {
        getBoxModelCalled = true;
        return { model: { border: boxModel } };
      },
    });

    elemHelper.__set__("overlayHandler", {
      highlightQuad: async (args) => {
        highlightQuadCalled = true;
        highlightQuadArgs = args;
      },
      hideHighlight: async () => {
        hideHighlightCalled = true;
      },
    });
    actualConsole = console;
    elemHelper.__set__("console", {
      warn: (warning) => {
        warningMessage = warning;
      },
    });
    setConfig({ highlightOnAction: true });
  });

  afterEach(() => {
    elemHelper = rewire("../../../lib/elements/elementHelper");
    // biome-ignore lint/suspicious/noGlobalAssign: Required for testing
    console = actualConsole;
  });

  it("should highlight visible element", async () => {
    boxModel = [8, 45.96875, 246, 45.96875, 246, 63.96875, 8, 63.96875];
    await elemHelper.highlightElement(createElement(20, true));

    expect(getBoxModelCalled).to.be.true;
    expect(highlightQuadArgs).to.be.equal(boxModel);
    expect(hideHighlightCalled).to.be.true;
    expect(warningMessage).to.be.equal(null);
  });

  it("should not highlight when element is not visible", async () => {
    await elemHelper.highlightElement(createElement(20, false));

    expect(getBoxModelCalled).to.be.false;
    expect(highlightQuadCalled).to.be.false;
    expect(hideHighlightCalled).to.be.false;
    expect(warningMessage).to.be.equal(
      "WARNING: Taiko cannot highlight hidden elements.",
    );
  });

  it("should not highlight when highlightOnAction is false", async () => {
    setConfig({ highlightOnAction: false });
    await elemHelper.highlightElement(createElement(20, true));

    expect(getBoxModelCalled).to.be.false;
    expect(highlightQuadCalled).to.be.false;
    expect(hideHighlightCalled).to.be.false;
    expect(warningMessage).to.be.equal(null);
  });
});
