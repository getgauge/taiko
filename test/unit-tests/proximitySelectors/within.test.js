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
  within,
  text,
  alert,
  accept,
  button,
  click,
} = require("../../../lib/taiko");
const {
  createHtml,
  removeFile,
  openBrowserArgs,
  resetConfig,
} = require("../test-util");
const test_name = "within";

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
        var div = document.createElement('div');
        div.appendChild(button)
        shadow.appendChild(div);
        
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

  describe("test selector with within", () => {
    it("element within should exists", async () => {
      expect(await text("taiko", within($(".test"))).exists()).to.be.true;
    });
  });

  describe("test selector in shadow dom", () => {
    it("element inside shadow dom should exists", async () => {
      expect(await text("Shadow Click", within($("div"))).exists()).to.be.true;
    });
  });

  describe("test action with within", () => {
    it("should click", async () => {
      alert("Hello from the shadows", async () => {
        await accept();
      });
      await click(button("Shadow Click", within($("div"))));
    });
  });

  describe("test within description", () => {
    it("should have proper description with string", () => {
      const withinSelector = within("taiko");
      expect(withinSelector.desc).to.equal("within taiko");
    });
    it("should have proper description with selector", () => {
      const withinSelector = within($(".test"));
      expect(withinSelector.desc).to.equal(
        "within CustomSelector with query .test ",
      );
    });
  });
});
