const expect = require("chai").expect;
const {
  openBrowser,
  highlight,
  closeBrowser,
  clearHighlights,
  goto,
  evaluate,
  $,
  setConfig,
} = require("taiko");
const {
  createHtml,
  removeFile,
  openBrowserArgs,
  resetConfig,
} = require("./test-util");
const test_name = "Highlight";

describe(test_name, () => {
  let filePath;
  before(async () => {
    const innerHtml = `
            <div>
                <a href="/">
                    Text node
                </a>
            </div>
            `;
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

  it("should highlight text node", async () => {
    await highlight("Text node");
    const res = await evaluate($("a"), (elem) => {
      return elem.classList;
    });
    expect(res[0]).to.be.eql("taiko_highlight_style");
  });

  it("should add a taiko_highlight style to pages head", async () => {
    await highlight("Text node");
    const styleExists = await evaluate(() => {
      return document.getElementById("taiko_highlight") != null;
    });
    expect(styleExists).to.be.true;
  });

  it("should clear all highlights for current page", async () => {
    await highlight("Text node");
    let res = await evaluate($("a"), (elem) => {
      return elem.classList;
    });
    expect(res[0]).to.be.eql("taiko_highlight_style");
    await clearHighlights();
    res = await evaluate($("a"), (elem) => {
      return elem.classList;
    });
    expect(res).to.be.empty;
  });
});
