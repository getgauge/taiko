const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const {
  openBrowser,
  closeBrowser,
  goto,
  image,
  below,
  setConfig,
  $,
} = require("../../lib/taiko");
const {
  createHtml,
  removeFile,
  openBrowserArgs,
  resetConfig,
} = require("./test-util");
const test_name = "image";

describe(test_name, () => {
  let filePath;
  before(async () => {
    const innerHtml = `
        <div class="example">
            <h3>Images</h3>
            <img src="brokenImage.jpg" id="brokenImage">
            <img src="avatar-blank.jpg" alt="avatar">
            <h3>Div Image</h3>
            <div id="divImage" style="background-image: url('image.png')"></div>
            <p id="paraImage" style="background-image: url('something.png')">okay</p>
            <img src="avatar-blank.jpg" alt="similarImage1">
            <img src="avatar-blank.jpg" alt="similarImage2">
            <img src="avatar-blank.jpg" alt="similarImage3">
            <div id="hiddenDivImage" style="display: none; background-image: url('image.png')">
            <img id="hiddenImage" style="display: none" src="avatar-blank.jpg" alt="avatar">
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

  describe("image exists in page", () => {
    it("should find the image with text", async () => {
      expect(await image("avatar").exists()).to.be.true;
    });
    it("should find the image with selectors", async () => {
      expect(await image({ id: "brokenImage" }).exists()).to.be.true;
      expect(await image({ src: "brokenImage.jpg" }).exists()).to.be.true;
    });
    it("should find the image with proximity selector", async () => {
      expect(await image(below("Images")).exists()).to.be.true;
    });
    it("should find div image using selectors", async () => {
      expect(await image({ id: "divImage" }).exists()).to.be.true;
    });
    it("should find p tag image using selectors", async () => {
      expect(await image({ id: "paraImage" }).exists()).to.be.true;
    });
    it("should find the div image with proximity selector", async () => {
      expect(await image(below("Div Image")).exists()).to.be.true;
    });
    it("should return true when isVisible fn is observed on non hidden element", async () => {
      expect(await image(below("Div Image")).isVisible()).to.be.true;
    });
  });

  describe("image description in page", () => {
    it("should find the image with text", async () => {
      expect(image("avatar").description).to.be.eql("Image with alt avatar ");
    });
    it("should find the image with selectors", async () => {
      expect(image({ id: "brokenImage" }).description).to.be.eql(
        'Image[id="brokenImage"]',
      );
      expect(image({ src: "brokenImage.jpg" }).description).to.be.eql(
        'Image[src="brokenImage.jpg"]',
      );
    });
    it("should find the image with proximity selector", async () => {
      expect(image(below("Images")).description).to.be.eql(
        "Image below Images",
      );
    });
    it("should find div image using selectors", async () => {
      expect(image({ id: "divImage" }).description).to.be.eql(
        'Image[id="divImage"]',
      );
    });
    it("should find p tag image using selectors", async () => {
      expect(image({ id: "paraImage" }).description).to.be.eql(
        'Image[id="paraImage"]',
      );
    });
    it("should find the div image with proximity selector", async () => {
      expect(image(below("Div Image")).description).to.be.eql(
        "Image below Div Image",
      );
    });
  });

  xdescribe("image text in page", () => {
    //Todo: Need to discuss on should we expose this api or not
    it("should find the image with text", async () => {
      expect(await image("avatar").text()).to.be.eql("image with alt avatar ");
    });
    it("should find the image with selectors", async () => {
      expect(await image({ id: "brokenImage" }).text()).to.be.eql(
        "image[@id = concat('brokenImage', \"\")]",
      );
      expect(await image({ src: "brokenImage.jpg" }).text()).to.be.eql(
        "image[@src = concat('brokenImage.jpg', \"\")]",
      );
    });
    it("should find the image with proximity selector", async () => {
      expect(await image(below("Images")).text()).to.be.eql(
        "image below Images",
      );
    });
    it("should find div image using selectors", async () => {
      expect(await image({ id: "divImage" }).text()).to.be.eql(
        "image[@id = concat('divImage', \"\")]",
      );
    });
    it("should find p tag image using selectors", async () => {
      expect(await image({ id: "paraImage" }).text()).to.be.eql(
        "image[@id = concat('paraImage', \"\")]",
      );
    });
    it("should find the div image with proximity selector", async () => {
      expect(await image(below("Div Image")).text()).to.be.eql(
        "image below Div Image",
      );
    });
  });

  describe("test elementsList properties", () => {
    it("test get of elements", async () => {
      const elements = await image("similarImage").elements();
      expect(elements[0].get()).to.be.a("string");
    });

    it("test description of elements", async () => {
      const elements = await image("similarImage").elements();
      expect(elements[0].description).to.be.eql("Image with alt similarImage ");
    });

    xit("test text of elements", async () => {
      const elements = await image("similarImage").elements();
      expect(await elements[0].text()).to.be.eql(
        "image with alt similarImage ",
      );
    }); //Todo: Need to discuss on should we expose this api or not

    it("test text should throw if the element is not found", async () => {
      await expect(image(".foo").text()).to.be.eventually.rejectedWith(
        "Image with alt .foo  not found",
      );
    });
  });

  describe("image with hidden style", () => {
    it("should be able to find hidden image", async () => {
      expect(await image({ id: "hiddenDivImage" }).exists()).to.be.true;
      expect(await image({ id: "hiddenImage" }).exists()).to.be.true;
    });

    it("should return false when isVisible fn is observed on hidden element", async () => {
      expect(await image({ id: "hiddenDivImage" }).isVisible()).to.be.false;
    });

    it("test isVisible() should throw if the element is not found", async () => {
      await expect(image("#foo").isVisible()).to.be.eventually.rejected;
    });
  });

  describe("Parameters validation", () => {
    it("should throw a TypeError when an ElementWrapper is passed as argument", async () => {
      expect(() => image($("div"))).to.throw(
        "You are passing a `ElementWrapper` to a `image` selector. Refer https://docs.taiko.dev/api/image/ for the correct parameters",
      );
    });
  });
});
