const { descEvent } = require("../../lib/helper");

const {
  openBrowser,
  goto,
  dragAndDrop,
  setConfig,
  closeBrowser,
  $,
} = require("../../lib/taiko");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;
const {
  createHtml,
  removeFile,
  openBrowserArgs,
  resetConfig,
} = require("./test-util");
const test_name = "DragAndDrop";

describe(test_name, () => {
  let filePath;

  const validateEmitterEvent = (event, expectedText) =>
    new Promise((resolve) => {
      descEvent.once(event, (eventData) => {
        expect(eventData).to.be.equal(expectedText);
        resolve();
      });
    });
  before(async () => {
    const innerHtml = `<div id="columns">
        <div class="column" id="column-a" draggable="true"><header>A</header></div>
        <div class="column" id="column-b" draggable="true" hidden><header>B</header></div>
        </div>`;

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

  describe("Drag and Drop test", () => {
    it("Should throw an error if either source or destination is not present", async () => {
      try {
        expect(await dragAndDrop($("#column-a"), $("#column-c")));
      } catch (err) {
        expect(err.message).to.equal(
          "CustomSelector with query #column-c  not found",
        );
      }
    });

    it("Should throw an error if either source or destination are hidden", async () => {
      try {
        expect(await dragAndDrop($("#column-a"), $("#column-b")));
      } catch (err) {
        expect(err.message).to.equal(
          "CustomSelector with query #column-b is not visible",
        );
      }
    });

    it("Should throw an error when we try to drag and drop hidden items forcefully", async () => {
      try {
        expect(
          await dragAndDrop($("#column-a"), $("#column-b"), { force: true }),
        );
      } catch (err) {
        expect(err.message).to.equal("Taiko cannot drag hidden elements");
      }
    });
  });
});
