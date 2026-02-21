const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const {
  openBrowser,
  closeBrowser,
  goto,
  color,
  toLeftOf,
  setConfig,
  $,
} = require("taiko");
const {
  createHtml,
  removeFile,
  openBrowserArgs,
  resetConfig,
} = require("./test-util");

describe("Color picker test", () => {
  let filePath;

  before(async () => {
    const innerHtml =
      `<script>
     
        class ShadowButton extends HTMLElement {
          constructor() {
            super();
            var shadow = this.attachShadow({mode: 'open'});
    
            var button = document.createElement('input');
            button.setAttribute('type', 'color');
            button.setAttribute('id', 'Shadow Click');
            button.addEventListener("click", event => {
              alert("Hello from the shadows");
            });
            shadow.appendChild(button);

            var hiddenButton = document.createElement('input');
            hiddenButton.setAttribute('type', 'color');
            hiddenButton.setAttribute('id', 'HiddenShadowButton');
            hiddenButton.setAttribute('style','display:none');
            shadow.appendChild(hiddenButton);
            
          }
        }
        customElements.define('shadow-button', ShadowButton);
      </script>` +
      " <shadow-button></shadow-button>" +
      `
      <div>
          <input type="color" id="head" name="head"
                 value="#e66465">
          <label for="head">Head</label>
      </div>
      
      <div>
          <input type="color" id="body" name="body"
                  value="#f6b73c">
          <label for="body">FirstElement</label>
      </div>

      <div>
          <input type="color" id="body" name="body"
                  value="#f6b73c">
          <label for="body">SecondElement</label>
      </div>`;
    filePath = createHtml(innerHtml, "Color Picker");
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

  describe("shadow dom", () => {
    it("inside shadow dom", async () => {
      expect(await color({ id: "Shadow Click" }).exists()).to.be.true;
    });

    it("should return false for hidden element when isVisible fn is called on shadow range", async () => {
      expect(await color({ id: "HiddenShadowButton" }).isVisible()).to.be.false;
    });
  });

  it("Set color picker", async () => {
    await color({ id: "head" }).select("#4903fc");
    expect(await color({ id: "head" }).value()).to.be.equal("#4903fc");
  });

  it("Set color picker without hash", async () => {
    await color({ id: "head" }).select("4903fc");
    expect(await color({ id: "head" }).value()).to.be.equal("#4903fc");
  });

  it("Set color picker with proximity selectors", async () => {
    await color(toLeftOf("Head")).select("#490333");
    expect(await color(toLeftOf("Head")).value()).to.be.equal("#490333");
  });

  it("Set color picker with rgb()", async () => {
    await color(toLeftOf("Head")).select("rgb(69, 35, 30)");
    expect(await color(toLeftOf("Head")).value()).to.be.equal("#45231e");
  });

  it("Should fail when color picker is set with invalid rgb()", async () => {
    await expect(
      color(toLeftOf("Head")).select("rgb(69,30)"),
    ).to.be.rejectedWith(
      "The color code rgb(69,30) is invalid. Please pass a valid HTML color code.",
    );
  });

  it("Should fail when color picker is set with invalid hex value", async () => {
    await expect(color(toLeftOf("Head")).select("#3233333")).to.be.rejectedWith(
      "The color code #3233333 is invalid. Please pass a valid HTML color code.",
    );
  });

  describe("Parameters validation", () => {
    it("should throw a TypeError when an ElementWrapper is passed as argument", async () => {
      expect(() => color($("div"))).to.throw(
        "You are passing a `ElementWrapper` to a `color` selector. Refer https://docs.taiko.dev/api/color/ for the correct parameters",
      );
    });

    it("should throw an Error when an no argument is passed", async () => {
      expect(() => color()).to.throw("At least one attribute is required!");
    });

    it("should throw an Error when an empty string is passed as argument", async () => {
      expect(() => color("")).to.throw("At least one attribute is required!");
    });
  });
});
