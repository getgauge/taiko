const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const {
  openBrowser,
  goto,
  closeBrowser,
  text,
  toRightOf,
  toLeftOf,
  above,
  below,
  near,
  setConfig,
} = require("taiko");
const {
  createHtml,
  removeFile,
  openBrowserArgs,
  resetConfig,
} = require("./test-util");
const test_name = "proximitySelector";

describe(test_name, () => {
  let filePath;
  before(async () => {
    const innerHtml =
      '<div style="display:flex; gap:20px; align-items:center;">' +
      '  <span id="label-left">LabelLeft</span>' +
      '  <span id="label-right">LabelRight</span>' +
      "</div>" +
      '<div style="display:flex; flex-direction:column; gap:20px;">' +
      '  <span id="label-top">LabelTop</span>' +
      '  <span id="label-bottom">LabelBottom</span>' +
      "</div>" +
      '<div style="position:relative;">' +
      '  <span id="label-near">LabelNear</span>' +
      '  <span id="target-near" style="margin-left:10px;">TargetNear</span>' +
      "</div>" +
      // hidden element — triggers empty quads[] from getContentQuads (regression for #2757)
      '<button style="display:none">HiddenButton</button>' +
      '<span style="display:none">HiddenText</span>';

    filePath = createHtml(innerHtml, test_name);
    await openBrowser(openBrowserArgs);
    await goto(filePath);
    setConfig({
      waitForNavigation: false,
      retryTimeout: 10,
      retryInterval: 10,
    });
  });

  after(async () => {
    resetConfig();
    await closeBrowser();
    removeFile(filePath);
  });

  describe("proximity selectors", () => {
    it("toRightOf should not throw TypeError", async () => {
      expect(
        await text("LabelRight", toRightOf("LabelLeft")).exists(),
      ).to.be.true;
    });

    it("toLeftOf should not throw TypeError", async () => {
      expect(
        await text("LabelLeft", toLeftOf("LabelRight")).exists(),
      ).to.be.true;
    });

    it("below should not throw TypeError", async () => {
      expect(
        await text("LabelBottom", below("LabelTop")).exists(),
      ).to.be.true;
    });

    it("above should not throw TypeError", async () => {
      expect(await text("LabelTop", above("LabelBottom")).exists()).to.be.true;
    });

    it("near should not throw TypeError", async () => {
      expect(
        await text("TargetNear", near("LabelNear")).exists(),
      ).to.be.true;
    });

    // Regression test for issue #2757:
    // hidden elements return empty quads[] from getContentQuads,
    // which previously caused TypeError: Cannot read properties of undefined (reading '1')
    it("proximity search near a hidden element should not crash", async () => {
      await expect(
        text("LabelNear", near("HiddenText")).exists(),
      ).to.not.be.rejectedWith(TypeError);
    });
  });
});
