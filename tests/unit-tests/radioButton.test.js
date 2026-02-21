const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const {
  openBrowser,
  radioButton,
  closeBrowser,
  goto,
  click,
  setConfig,
  evaluate,
  $,
} = require("taiko");
const {
  createHtml,
  removeFile,
  openBrowserArgs,
  resetConfig,
} = require("./test-util");

const test_name = "radio button";

describe(test_name, () => {
  let filePath;
  before(async () => {
    const innerHtml =
      `<script>

        class ShadowButton extends HTMLElement {
          constructor() {
            super();
            var shadow = this.attachShadow({mode: 'open'});

            var button = document.createElement('input');
            button.setAttribute('type', 'radio');
            button.setAttribute('id', 'Shadow Click');
            button.addEventListener("click", event => {
              alert("Hello from the shadows");
            });
            shadow.appendChild(button);

            var hiddenButton = document.createElement('input');
            hiddenButton.setAttribute('type', 'radio');
            hiddenButton.setAttribute('id', 'HiddenShadowButton');
            hiddenButton.setAttribute('style','display:none');
            shadow.appendChild(hiddenButton);

          }
        }
        customElements.define('shadow-button', ShadowButton);
      </script>` +
      " <shadow-button></shadow-button>" +
      "<form>" +
      '<input type="radio" id="radioButtonWithInlineLabel" name="testRadioButton" value="radioButtonWithInlineLabel">radioButtonWithInlineLabel</input>' +
      '<input type="Radio" name="testRadioButton" value="radioButtonWithInlineLabelAndUpperCaseTypeAttribute">radioButtonWithInlineLabelAndUpperCaseTypeAttribute</input>' +
      "<label>" +
      '<input name="testRadioButton" type="radio" value="radioButtonWithWrappedLabel"/>' +
      "<span>radioButtonWithWrappedLabel</span>" +
      "</label>" +
      "<label>" +
      '<input name="testRadioButton" type="RADIO" value="radioButtonWithWrappedLabelAndUpperCaseTypeAttribute"/>' +
      "<span>radioButtonWithWrappedLabelAndUpperCaseTypeAttribute</span>" +
      "</label>" +
      "<p>" +
      '<input id="radioButtonWithLabelFor" name="testRadioButton" type="radio" value="radioButtonWithLabelFor"/>' +
      '<label for="radioButtonWithLabelFor">radioButtonWithLabelFor</label>' +
      "</p>" +
      "<p>" +
      '<input id="radioButtonWithLabelForAndUpperCaseTypeAttribute" name="testRadioButton" type="radio" value="radioButtonWithLabelFor"/>' +
      '<label for="radioButtonWithLabelForAndUpperCaseTypeAttribute">radioButtonWithLabelForAndUpperCaseTypeAttribute</label>' +
      "</p>" +
      '<input name="hiddenRadioButton" type="radio" id="hiddenRadioButton" value="hiddenRadioButton">hiddenRadioButton</input>' +
      '<input type="reset" value="Reset">' +
      "</form>" +
      '<input type="radio" id="someRadioButton" name="testRadioButton" value="someRadioButton">someRadioButton</input>' +
      '<button id="panel" style="display:none">show on check</button>' +
      "<script>" +
      'document.getElementById("hiddenRadioButton").style.display = "none";' +
      'var elem = document.getElementById("radioButtonWithInlineLabel");' +
      'elem.addEventListener("click", myFunction);' +
      "function myFunction() {" +
      'document.getElementById("panel").style.display = "block";' +
      "}</script>";
    filePath = createHtml(innerHtml, "radioButton");
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

  describe("case insensitive selector", async () => {
    afterEach(async () => {
      await click("Reset");
    });

    it("test exists() with inline text", async () => {
      expect(
        await radioButton(
          "radioButtonWithInlineLabelAndUpperCaseTypeAttribute",
        ).exists(),
      ).to.be.true;
    });

    it("test exists() wrapped in label", async () => {
      expect(
        await radioButton(
          "radioButtonWithWrappedLabelAndUpperCaseTypeAttribute",
        ).exists(),
      ).to.be.true;
    });

    it("test exists() using label for", async () => {
      expect(
        await radioButton(
          "radioButtonWithLabelForAndUpperCaseTypeAttribute",
        ).exists(),
      ).to.be.true;
    });
  });

  describe("shadow dom", () => {
    it("inside shadow dom", async () => {
      expect(await radioButton({ id: "Shadow Click" }).exists()).to.be.true;
    });

    it("should return false for hidden element when isVisible fn is called on shadow radio button", async () => {
      expect(await radioButton({ id: "HiddenShadowButton" }).isVisible()).to.be
        .false;
    });
  });

  describe("with inline text", () => {
    afterEach(async () => {
      await click("Reset");
    });

    it("test exists()", async () => {
      expect(await radioButton("radioButtonWithInlineLabel").exists()).to.be
        .true;
      expect(await radioButton("Something").exists()).to.be.false;
    });

    it("test select()", async () => {
      await radioButton("radioButtonWithInlineLabel").select();
      const isSelected = await radioButton(
        "radioButtonWithInlineLabel",
      ).isSelected();
      expect(isSelected).to.be.true;
    });

    it("test select() should throw if the element is not found", async () => {
      await expect(radioButton("foo").select()).to.be.eventually.rejected;
    });

    it("test select() triggers events", async () => {
      await evaluate(() => {
        document.raisedEvents = [];
        const dropDown = document.getElementById("radioButtonWithLabelFor");
        for (const ev of ["input", "change", "click"]) {
          dropDown.addEventListener(ev, () => document.raisedEvents.push(ev));
        }
      });
      await radioButton("radioButtonWithLabelFor").select();
      const events = await evaluate(() => document.raisedEvents);
      expect(events).to.eql(["change", "input", "click"]);
    });

    it("test deselect()", async () => {
      await radioButton("radioButtonWithInlineLabel").select();
      await radioButton("radioButtonWithInlineLabel").deselect();
      const isSelected = await radioButton(
        "radioButtonWithInlineLabel",
      ).isSelected();
      expect(isSelected).to.be.false;
    });

    it("test deselect() should throw error if the element is not found", async () => {
      await expect(radioButton("foo").deselect()).to.be.eventually.rejected;
    });

    it("test isSelected()", async () => {
      await radioButton("radioButtonWithInlineLabel").select();
      expect(await radioButton("radioButtonWithInlineLabel").isSelected()).to.be
        .true;
    });

    it("test isSelected() to throw error if the element is not found", async () => {
      await expect(
        radioButton("foo").isSelected(),
      ).to.be.eventually.rejectedWith("");
    });

    it("test text should throw if the element is not found", async () => {
      await expect(radioButton(".foo").text()).to.be.eventually.rejectedWith(
        "",
      );
    });
  });

  describe("wrapped in label", () => {
    it("test exists()", async () => {
      expect(await radioButton("radioButtonWithWrappedLabel").exists()).to.be
        .true;
    });

    it("test description", async () => {
      const description = radioButton(
        "radioButtonWithWrappedLabel",
      ).description;
      expect(description).to.be.eql(
        "RadioButton with label radioButtonWithWrappedLabel ",
      );
    });
  });

  describe("with hidden style", () => {
    it("should find hidden radio buttons", async () => {
      expect(await radioButton("hiddenRadioButton").exists()).to.be.true;
    });

    it("should return true for non hidden element when isVisible fn is called on button", async () => {
      expect(await radioButton("radioButtonWithWrappedLabel").isVisible()).to.be
        .true;
    });

    it("should return false for hidden element when isVisible fn is called on textBox", async () => {
      expect(await radioButton({ id: "hiddenRadioButton" }).isVisible()).to.be
        .false;
    });
  });

  describe("using label for", () => {
    it("test exists()", async () => {
      expect(await radioButton("radioButtonWithLabelFor").exists()).to.be.true;
    });

    it("test description", async () => {
      const description = radioButton("radioButtonWithLabelFor").description;
      expect(description).to.be.eql(
        "RadioButton with label radioButtonWithLabelFor ",
      );
    });
  });

  describe("test elementList properties", () => {
    it("test get of elements", async () => {
      const elements = await radioButton({
        id: "someRadioButton",
      }).elements();
      expect(elements[0].get()).to.be.a("string");
    });

    it("test description of elements", async () => {
      const elements = await radioButton({
        id: "someRadioButton",
      }).elements();
      expect(elements[0].description).to.be.eql(
        'RadioButton[id="someRadioButton"]',
      );
    });

    it("test isSelected of elements", async () => {
      const elements = await radioButton({
        id: "someRadioButton",
      }).elements();
      expect(await elements[0].isSelected()).to.be.false;
    });

    it("test select of elements", async () => {
      const elements = await radioButton({
        id: "someRadioButton",
      }).elements();
      await elements[0].select();
      expect(await elements[0].isSelected()).to.be.true;
    });

    it("test deselect of elements", async () => {
      const elements = await radioButton({
        id: "someRadioButton",
      }).elements();
      await elements[0].deselect();
      expect(await elements[0].isSelected()).to.be.false;
    });
  });

  describe("Parameters validation", () => {
    it("should throw a TypeError when an ElementWrapper is passed as argument", async () => {
      expect(() => radioButton($("div"))).to.throw(
        "You are passing a `ElementWrapper` to a `radioButton` selector. Refer https://docs.taiko.dev/api/radiobutton/ for the correct parameters",
      );
    });
  });
});
