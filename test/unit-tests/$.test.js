const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const {
  openBrowser,
  closeBrowser,
  goto,
  $,
  setConfig,
} = require("../../lib/taiko");
const {
  createHtml,
  removeFile,
  openBrowserArgs,
  resetConfig,
} = require("./test-util");
const test_name = "$";

describe(test_name, () => {
  let filePath;
  before(async () => {
    const innerHtml = `
    <script>
    class ShadowButton extends HTMLElement {
      constructor() {
        super();
        var shadow = this.attachShadow({mode: 'open'});

        var button = document.createElement('input');
        button.setAttribute('type', 'button');
        button.setAttribute('value', 'Shadow Click');
        button.addEventListener("click", event => {
          alert("Hello from the shadows");
        });
        shadow.appendChild(button);

      }
    }
    customElements.define('shadow-button', ShadowButton);
  </script>

  <input type='button' value='normalButton'/>
        <div class="test">
            <p id="foo">taiko</p>
            <p>demo</p>
        </div>
        <div class="hiddenTest">
            <p id="hidden" style="display:none">taiko-hidden</p>
            <p>demo</p>
    </div>
    <shadow-button>
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

  describe("test with query function", () => {
    it("should construct elementWrapper from function returning Node", async () => {
      expect(
        await $(() => {
          return document.querySelector("#foo");
        }).exists(),
      ).to.be.true;
    });
    it("should construct elementWrapper from function returning NodeList", async () => {
      expect(
        await $(() => {
          return document.querySelectorAll("#foo");
        }).exists(),
      ).to.be.true;
    });
    it("should accept args to be passed to query function as an option", async () => {
      expect(
        await $((selector) => document.querySelector(selector), {
          args: "#foo",
        }).exists(),
      ).to.be.true;
    });
    it("should throw an error if the query function does not return a node or nodeList", async () => {
      await expect($(() => {}).exists()).to.be.eventually.rejectedWith(
        "Query function should return a DOM Node or DOM NodeList",
      );
    });
  });

  describe("text with xpath", () => {
    it("should find text with xpath", async () => {
      expect(await $("//*[text()='taiko']").exists()).to.be.true;
    });

    it("test description with xpath", async () => {
      expect($("//*[text()='taiko']").description).to.be.eql(
        "CustomSelector with query //*[text()='taiko'] ",
      );
    });

    it("test text() with xpath", async () => {
      expect(await $("//*[text()='taiko']").text()).to.be.eql("taiko");
    });

    it("should return true for non hidden element when isVisible fn is called", async () => {
      expect(await $("//*[text()='taiko']").isVisible()).to.be.true;
    });

    it("test isVisible() to throw if no element is found", async () => {
      await expect($("//*[text()='foo']").isVisible()).to.be.eventually
        .rejected;
    });

    it("should return false for hidden element when isVisible fn is called on text", async () => {
      expect(await $("#hidden").isVisible()).to.be.false;
    });
  });

  describe("test with selectors", () => {
    it("should find text with selectors", async () => {
      expect(await $("#foo").exists()).to.be.true;
      expect(await $(".test").exists()).to.be.true;
    });

    it("should return true for non hidden element when isVisible fn is called on text", async () => {
      expect(await $("#foo").isVisible()).to.be.true;
    });

    it("test description with selectors", async () => {
      expect($("#foo").description).to.be.eql(
        "CustomSelector with query #foo ",
      );
      expect($(".test").description).to.be.eql(
        "CustomSelector with query .test ",
      );
    });

    it("test text with selectors", async () => {
      expect(await $("#foo").text()).to.be.eql("taiko");
      expect(await $(".test").text()).to.be.eql("taiko\n\ndemo");
    });

    it("test text should throw if the element is not found", async () => {
      await expect($(".foo").text()).to.be.eventually.rejectedWith(
        "CustomSelector with query .foo  not found",
      );
    });

    it("test exists inside shadow dom", async () => {
      expect(await $('input[value="Shadow Click"]').exists()).to.be.true;
    });
  });

  describe("test elementList properties", () => {
    it("test get()", async () => {
      const elems = await $("#foo").elements();
      expect(elems[0].get()).to.be.a("string");
    });

    it("test isVisible of elements", async () => {
      const elements = await $("#foo").elements();
      expect(await elements[0].isVisible()).to.be.true;
    });

    it("test description", async () => {
      const elems = await $("#foo").elements();
      expect(elems[0].description).to.be.eql("CustomSelector with query #foo ");
    });

    it("test text()", async () => {
      const elems = await $("#foo").elements();
      expect(await elems[0].text()).to.be.eql("taiko");
    });

    it("test text() with element index", async () => {
      const elems = await $("#foo").element(0);
      expect(await elems.text()).to.be.eql("taiko");
    });

    it("Should throw error when element index is out of bound", async () => {
      await $("#foo")
        .element(1)
        .catch((err) => {
          expect(err).to.include(
            /Element index is out of range. There are only 1 element(s)/,
          );
        });
    });

    it("should get all elements matching including shadow dom", async () => {
      expect((await $('input[type="button"]').elements()).length).to.equal(2);
    });
  });

  describe("Parameters validation", () => {
    it("should throw a TypeError when an ElementWrapper is passed as argument", async () => {
      expect(() => $($("#foo"))).to.throw(
        "You are passing a `ElementWrapper` to a `$` selector. Refer https://docs.taiko.dev/api/$/ for the correct parameters",
      );
    });
  });
});
