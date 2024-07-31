const {
  createHtml,
  openBrowserArgs,
  removeFile,
  resetConfig,
} = require("./test-util");
const {
  openBrowser,
  goto,
  evaluate,
  text,
  closeBrowser,
  setConfig,
} = require("../../lib/taiko");
const expect = require("chai").expect;
const testName = "Evaluate";

describe(testName, () => {
  let filePath;
  before(async () => {
    const innerHtml = `<section class="header">
                <h1>${testName} tests</h1>
            </section>
            <section class='main-content'>
                <div class='item'>
                    Item 1
                </div>
                <div class='item'>
                    Item 2
                </div>
            </section>
            `;
    filePath = createHtml(innerHtml, testName);
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

  describe("with selector", () => {
    it("should return the result on the evaluation", async () => {
      const expected = "Item 1";
      const actual = await evaluate(text("Item 1"), (element) => {
        return element.textContent.trim();
      });
      expect(actual).to.be.equal(expected);
    });

    it("should pass args to the callback", async () => {
      const expected = "Updated Item 1 with new item";
      await evaluate(
        text("Item 1"),
        (element, args) => {
          element.textContent = args[0];
        },
        { args: [expected] },
      );
      const actual = await text(expected).exists();
      expect(actual).to.be.true;
    });
  });

  describe("without selector", () => {
    it("should pass root html element to the function to be evaluated", async () => {
      const actual = await evaluate((rootElement) => {
        return rootElement.outerHTML;
      });
      expect(actual).to.match(/^<html>/);
      expect(actual).to.match(/<\/html>$/);
    });

    it("should pass args to the callback", async () => {
      const newText = "Updated Item 1 with new item";
      await evaluate(
        (element, args) => {
          document.body.innerHTML = args[0];
        },
        { args: [newText] },
      );
      expect(await text("Item 2").exists()).to.be.false;
    });

    it("should return the result of the evaluation", async () => {
      const actual = await evaluate(() => {
        return document.title;
      });
      expect(actual).to.equal(testName);
    });

    it("should return the result of evaluation with async function", async () => {
      const actual = await evaluate(async () => {
        return document.title;
      });
      expect(actual).to.equal(testName);
    });

    it("should pass args to the callback", async () => {
      const newText = "Updated Item 1 with new item";
      await evaluate(
        (element, args) => {
          element.innerHTML = args[0];
        },
        { args: [newText] },
      );
      const actual = await text("Item 2").exists();
      expect(actual).to.be.false;
    });
  });
});
