const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const {
  openBrowser,
  closeBrowser,
  goto,
  link,
  toRightOf,
  setConfig,
  $,
} = require("../../lib/taiko");
const {
  createHtml,
  removeFile,
  openBrowserArgs,
  resetConfig,
} = require("./test-util");
const test_name = "link";

describe(test_name, () => {
  let filePath;
  before(async () => {
    const innerHtml = `
        <p>
            Click <a id="redirect" href="redirect">here</a> to trigger a redirect.
            <a href="link1">similarLink1</a>
            <a href="link2">similarLink2</a>
            <a href="link3">similarLink3</a>
        </p>
        <p>
            Test <a id="hiddenLinkID" href="redirect1" style="display:none">HiddenLink</a> to trigger a redirect.
        </p>
        
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

  describe("link exists in page", () => {
    it("should find the link with text", async () => {
      expect(await link("here").exists()).to.be.true;
    });
    it("should find the link with id", async () => {
      expect(await link({ id: "redirect" }).exists()).to.be.true;
    });
    it("should find the link with proximity selector", async () => {
      expect(await link(toRightOf("Click")).exists()).to.be.true;
    });
    it("should find the link for Hidden Elements with ID", async () => {
      expect(await link({ id: "hiddenLinkID" }).exists()).to.be.true;
    });
    it("should find the link for Hidden Elements with Text", async () => {
      expect(await link("HiddenLink").exists()).to.be.true;
    });

    it("should return false when isVisible fn is observed on hidden element", async () => {
      expect(await link("HiddenLink").isVisible()).to.be.false;
    });

    it("test isVisible() should throw err when element not found", async () => {
      await expect(link("foo").isVisible()).to.be.rejected;
    });
  });

  describe("link description in page", () => {
    it("should find the link with text", async () => {
      expect(link("here").description).to.be.eql("Link with text here ");
    });
    it("should find the link with id", async () => {
      expect(link({ id: "redirect" }).description).to.be.eql(
        'Link[id="redirect"]',
      );
    });
    it("should find the link with proximity selector", async () => {
      expect(link(toRightOf("Click")).description).to.be.eql(
        "Link to right of Click",
      );
    });
    it("should return true when isVisible fn is observed on non hidden element", async () => {
      expect(await link("here").isVisible()).to.be.true;
    });
  });

  describe("link text in page", () => {
    it("should find the link with text", async () => {
      expect(await link("here").text()).to.be.eql("here");
    });
    it("should find the link with id", async () => {
      expect(await link({ id: "redirect" }).text()).to.be.eql("here");
    });
    it("should find the link with proximity selector", async () => {
      expect(await link(toRightOf("Click")).text()).to.be.eql("here");
    });

    it("test text should throw if the element is not found", async () => {
      await expect(link(".foo").text()).to.be.eventually.rejectedWith(
        "Link with text .foo  not found",
      );
    });
  });

  describe("test elementsList properties", () => {
    it("test get of elements", async () => {
      const elements = await link("similarLink").elements();
      expect(elements[0].get()).to.be.a("string");
    });

    it("test isVisible of elements", async () => {
      const elements = await link("similarLink").elements();
      expect(await elements[0].isVisible()).to.be.true;
    });

    it("test description of elements", async () => {
      const elements = await link("similarLink").elements();
      expect(elements[0].description).to.be.eql("Link with text similarLink ");
    });

    it("test text of elements", async () => {
      const elements = await link("similarLink").elements();
      expect(await elements[0].text()).to.be.eql("similarLink1");
      expect(await elements[1].text()).to.be.eql("similarLink2");
      expect(await elements[2].text()).to.be.eql("similarLink3");
    });

    it("test text of element with index", async () => {
      const firstElement = await link("similarLink").element(0);
      expect(await firstElement.text()).to.be.eql("similarLink1");
      const secondElement = await link("similarLink").element(1);
      expect(await secondElement.text()).to.be.eql("similarLink2");
      const thirdElement = await link("similarLink").element(2);
      expect(await thirdElement.text()).to.be.eql("similarLink3");
    });
  });

  describe("Parameters validation", () => {
    it("should throw a TypeError when an ElementWrapper is passed as argument", async () => {
      expect(() => link($("p"))).to.throw(
        "You are passing a `ElementWrapper` to a `link` selector. Refer https://docs.taiko.dev/api/link/ for the correct parameters",
      );
    });
  });
});
