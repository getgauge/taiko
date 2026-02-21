const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const {
  openBrowser,
  closeBrowser,
  goto,
  listItem,
  setConfig,
  $,
} = require("taiko");

const {
  createHtml,
  removeFile,
  openBrowserArgs,
  resetConfig,
} = require("./test-util");

const test_name = "list Item";

describe(test_name, () => {
  let filePath;
  before(async () => {
    const innerHtml = `
      <ul>
        <li id="coffee">Coffee</li>
        <li>Tea</li>
        <li>Milk</li>
      </ul>
      <div class="hiddenTest">
           <li id="hidden" style="display:none">taiko-hidden</li>
           <p>demo</p>
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

  describe("test node", () => {
    it("test exists()", async () => {
      expect(await listItem({ id: "coffee" }).exists()).to.be.true;
    });

    it("test description", async () => {
      expect(listItem({ id: "coffee" }).description).to.be.eql(
        'ListItem[id="coffee"]',
      );
    });

    it("test text()", async () => {
      expect(await listItem({ id: "coffee" }).text()).to.be.eql("Coffee");
    });

    it("test text should throw if the element is not found", async () => {
      await expect(listItem(".foo").text()).to.be.eventually.rejected;
    });

    it("should return false for hidden element when isVisible fn is called on listItem", async () => {
      expect(await listItem({ id: "hidden" }).isVisible()).to.be.false;
    });

    it("should return true for non hidden element when isVisible fn is called on listItem", async () => {
      expect(await listItem({ id: "coffee" }).isVisible()).to.be.true;
    });

    it("test isVisible() should throw if the element is not found", async () => {
      await expect(listItem("foo").isVisible()).to.be.eventually.rejected;
    });
  });

  describe("test elementsList properties", () => {
    it("test get()", async () => {
      const elems = await listItem({ id: "coffee" }).elements();
      expect(elems[0].get()).to.be.a("string");
    });

    it("test isVisible of elements", async () => {
      const elements = await listItem({ id: "coffee" }).elements();
      expect(await elements[0].isVisible()).to.be.true;
    });

    it("test description", async () => {
      const elems = await listItem({ id: "coffee" }).elements();
      expect(elems[0].description).to.be.eql('ListItem[id="coffee"]');
    });

    it("test text()", async () => {
      const elems = await listItem({ id: "coffee" }).elements();
      expect(await elems[0].text()).to.be.eql("Coffee");
    });
  });

  describe("Parameters validation", () => {
    it("should throw a TypeError when an ElementWrapper is passed as argument", async () => {
      expect(() => listItem($("p"))).to.throw(
        "You are passing a `ElementWrapper` to a `listItem` selector. Refer https://docs.taiko.dev/api/listitem/ for the correct parameters",
      );
    });
  });
});
