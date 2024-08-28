const path = require("node:path");
const { pathToFileURL } = require("node:url");
const {
  goto,
  openBrowser,
  $,
  closeBrowser,
  scrollTo,
} = require("../../lib/taiko");
const chai = require("chai");
const expect = chai.expect;

describe("Visible", () => {
  let pathFile;
  beforeEach(async () => {
    const htmlFilePath = path.join(
      process.cwd(),
      "test",
      "unit-tests",
      "data",
      "visibility.html",
    );
    pathFile = pathToFileURL(htmlFilePath).toString();
    await openBrowser();
    await goto(pathFile);
  });
  it("Should return visibility of element as false when element is not in viewport", async () => {
    const element = $("#btn10");
    expect(await element.isVisible()).to.be.equal(false);
  });

  it("Should return visibility of element as true when element in viewport", async () => {
    const htmlFilePath = path.join(
      process.cwd(),
      "test",
      "unit-tests",
      "data",
      "visibility.html",
    );
    const pathFile = pathToFileURL(htmlFilePath).toString();
    const element = $("#btn10");
    await scrollTo(element);
    expect(await element.isVisible()).to.be.equal(true);
  });

  afterEach(async () => {
    await closeBrowser();
  });
});
