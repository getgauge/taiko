const { descEvent } = require("../../lib/helper");

const {
  openBrowser,
  goto,
  below,
  dropDown,
  evaluate,
  closeBrowser,
  setConfig,
  $,
} = require("../../lib/taiko");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;
const {
  createHtml,
  removeFile,
  openBrowserArgs,
  resetConfig,
} = require("./test-util");
const test_name = "DropDown";

describe(test_name, () => {
  let filePath;

  const validateEmitterEvent = (event, expectedText) =>
    new Promise((resolve) => {
      descEvent.once(event, (eventData) => {
        expect(eventData).to.be.equal(expectedText);
        resolve();
      });
    });
  before(async () => {
    const innerHtml =
      "<form>" +
      '<label for="select">Cars</label>' +
      '<select id="select" name="select" value="select">' +
      '<option value="volvo">Volvo</option>' +
      '<option value="saab" disabled>Saab</option>' +
      '<option value="mercedes">Mercedes</option>' +
      '<option value="audi">Audi</option>' +
      "</select>" +
      '<label for="foods">Foods</label>' +
      '<select id="foods" name="select" value="select" multiple>' +
      '<option value="pizza">Pizza</option>' +
      '<option value="burger" disabled>Burger</option>' +
      '<option value="pasta">Pasta</option>' +
      '<option value="sandwich">Sandwich</option>' +
      "</select>" +
      '<label for="attire">Attire</label>' +
      '<select id="attire" name="select" value="select" multiple>' +
      '<option value="shirt">Shirt</option>' +
      '<option value="trouser">Trouser</option>' +
      '<option value="jumper" disabled>Jumper</option>' +
      '<option value="blazer">Blazer</option>' +
      "</select>" +
      '<label for="country">Country</label>' +
      '<select id="country" name="select" value="select" multiple>' +
      '<option value="england">England</option>' +
      '<option value="india">India</option>' +
      '<option value="canada">Canada</option>' +
      '<option value="scotland">Scotland</option>' +
      "</select>" +
      '<label for="hiddenselect">Hidden Cars</label>' +
      '<select id="hiddenselect" name="select" value="select" style="display:none">' +
      '<option value="volvo">Volvo</option>' +
      '<option value="saab" disabled>Saab</option>' +
      '<option value="mercedes">Mercedes</option>' +
      '<option value="audi">Audi</option>' +
      "</select>" +
      '<div name="ReasonText"> Reason: </div>' +
      '<select class="select" name="reasonselection">' +
      '<option value="-99"> Select </option>' +
      '<option value="9092">Reason1</option>' +
      '<option value="9093">Reason2</option>' +
      "</select>" +
      '<div name="FeedbackText"> Feedback: </div>' +
      '<select class="select" name="feedbackselection" multiple>' +
      '<option value="10">Poor</option>' +
      '<option value="20">Good</option>' +
      '<option value="30">Excellent</option>' +
      "</select>" +
      "<label>" +
      "<span>dropDownWithWrappedInLabel</span>" +
      '<select id="select" name="select" value="select">' +
      '<option value="volvo1">Volvo1</option>' +
      '<option value="saab1">Saab1</option>' +
      '<option value="mercedes1">Mercedes1</option>' +
      '<option value="audi1">Audi1</option>' +
      "</select>" +
      "</label>" +
      '<select id="sampleDropDown" name="select" value="select">' +
      '<option value="someValue">someValue</option>' +
      "</select>" +
      "</form>" +
      `<div id="one">
        <label for="select-one">One</label>
        <select id="select-one" name="select" value="select">
          <option>Select One</option>
          <option>Hot Beverages</option>
          </select>
      </div>
      <div id="two">
        <label for="select-two">Two</label>
        <select id="select-two" name="select" value="select">
          <option>Please select from above</option>
          </select>
      </div>
      <script>
        var textTwo = document.getElementById("select-two");
      var divOne = document.getElementById("one");

      divOne.addEventListener("change", function() {
        textTwo.innerHTML = "<option>Tea</option><option>Cofee</option>";
      });
  </script>`;
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

  describe("using label for", () => {
    it("test dropdown exists()", async () => {
      expect(await dropDown("Cars").exists()).to.be.true;
    });

    it("test dropdown description", async () => {
      expect(dropDown("Cars").description).to.be.eql(
        "DropDown with label Cars ",
      );
    });

    it("test dropdown text()", async () => {
      expect(await dropDown("Cars").text()).to.be.eql(
        "Volvo\nSaab\nMercedes\nAudi",
      );
    });

    it("test text should throw if the element is not found", async () => {
      await expect(dropDown(".foo").text()).to.be.eventually.rejectedWith(
        "DropDown with label .foo  not found",
      );
    });

    it("test should throw error if multiple values are selected for single dropdown", async () => {
      try {
        expect(await dropDown("Cars").select(["Audi", "mercedes"]));
      } catch (err) {
        expect(err.message).to.equal(
          "Cannot select multiple values on a single select dropdown",
        );
      }
    });

    it("should return false for hidden element when isVisible fn is called on dropDown", async () => {
      expect(await dropDown("Hidden Cars").isVisible()).to.be.false;
    });

    it("test select()", async () => {
      await dropDown("Cars").select("Audi");
      await dropDown("Cars").select("mercedes");
      expect(await dropDown("Cars").value()).to.equal("mercedes");
    });

    it("test select() with multiple values", async () => {
      await dropDown("Attire").select(["Shirt", "Blazer"]);
      expect(await dropDown("Attire").value()).to.deep.equal([
        "shirt",
        "blazer",
      ]);
    });

    it("test options()", async () => {
      expect(await dropDown({ id: "select" }).options()).to.eql([
        "volvo",
        "saab",
        "mercedes",
        "audi",
      ]);
    });

    it("test select() should thrown when selecting on disabled option", async () => {
      try {
        expect(await dropDown("Cars").select("Saab"));
      } catch (err) {
        expect(err.message).to.equal(
          "Cannot set value Saab on a disabled field",
        );
      }
    });

    it("test select() should throw when selecting multiple values and one of the value is disabled", async () => {
      try {
        expect(await dropDown("Foods").select(["Burger", "Pasta"]));
      } catch (err) {
        expect(err.message).to.equal(
          "Cannot set value Burger on a disabled field",
        );
        expect(await dropDown("Foods").value()).to.equal("");
      }
    });
  });

  describe("Select using index", () => {
    it("test select() using index", async () => {
      await dropDown(below("Reason")).select({ index: 1 });
      expect(await dropDown(below("Reason")).value()).to.equal("9092");
    });
    it("test select() using array of index", async () => {
      await dropDown(below("Feedback")).select({ index: [1, 2] });
      expect(await dropDown(below("Feedback")).value()).to.deep.equal([
        "20",
        "30",
      ]);
    });
  });

  describe("wrapped in label", () => {
    it("test exists()", async () => {
      expect(await dropDown("dropDownWithWrappedInLabel").exists()).to.be.true;
      expect(await dropDown("dropDownWithWrappedInLabel").value()).to.not.equal(
        "mercedes",
      );
    });

    it("test description", async () => {
      expect(dropDown("dropDownWithWrappedInLabel").description).to.be.eql(
        "DropDown with label dropDownWithWrappedInLabel ",
      );
    });

    it("test text()", async () => {
      expect(await dropDown("dropDownWithWrappedInLabel").text()).to.be.eql(
        "Volvo1\nSaab1\nMercedes1\nAudi1",
      );
    });
  });

  describe("test logs for dropdown", () => {
    it("should show exists", async () => {
      const validatePromise = validateEmitterEvent("success", "Exists");
      await dropDown("Cars").exists();
      await validatePromise;
    });

    it("should show selected index", async () => {
      const validatePromise = validateEmitterEvent("success", "Selected 1");
      await dropDown(below("Reason")).select({ index: 1 });
      await validatePromise;
    });

    it("should show selected value", async () => {
      const validatePromise = validateEmitterEvent(
        "success",
        "Selected mercedes",
      );
      await dropDown("Cars").select("mercedes");
      await validatePromise;
    });
  });

  describe("test elementList properties", () => {
    it("test get of elements", async () => {
      const elements = await dropDown({
        id: "sampleDropDown",
      }).elements();
      expect(elements[0].get()).to.be.a("string");
    });

    it("test description of elements", async () => {
      const elements = await dropDown({
        id: "sampleDropDown",
      }).elements();
      expect(elements[0].description).to.be.eql(
        'DropDown[id="sampleDropDown"]',
      );
    });

    it("test text of elements", async () => {
      const elements = await dropDown({
        id: "sampleDropDown",
      }).elements();
      expect(await elements[0].text()).to.be.eql("someValue");
    });

    it("test select of elements", async () => {
      const validatePromise = validateEmitterEvent(
        "success",
        "Selected someValue",
      );
      const elements = await dropDown({
        id: "sampleDropDown",
      }).elements();
      await elements[0].select("someValue");
      await validatePromise;
    });

    it("test get value of elements", async () => {
      const elements = await dropDown({
        id: "sampleDropDown",
      }).elements();
      await elements[0].select("someValue");
      expect(await elements[0].value()).to.equal("someValue");
    });

    it("test get value of multiple selected elements", async () => {
      const elements = await dropDown({
        id: "sampleDropDown",
      }).elements();
      await elements[0].select("someValue");
      expect(await elements[0].value()).to.equal("someValue");
    });
  });

  describe("nested drop down", () => {
    it("should bubble change event", async () => {
      await dropDown("One").select("Hot Beverages");
      await expect(dropDown("Two").select("Tea")).not.to.be.eventually.rejected;
    });

    it("should emit events", async () => {
      await evaluate(() => {
        document.raisedEvents = [];
        const dropDown = document.getElementById("select-one");
        for (const ev of ["input", "change"]) {
          dropDown.addEventListener(ev, () => document.raisedEvents.push(ev));
        }
      });

      await dropDown("One").select("Hot Beverages");

      const events = await evaluate(() => document.raisedEvents);
      expect(events).to.eql(["change", "input"]);
    });
  });

  describe("regex based selection", () => {
    it("should select value specified by a regex ", async () => {
      await dropDown("Cars").select(/M.rc.d.s/);
      expect(await dropDown("Cars").value()).to.equal("mercedes");
    });
    it("should select multiple values specified by a regex ", async () => {
      await dropDown("Country").select(/and/);
      expect(await dropDown("Country").value()).to.deep.equal([
        "england",
        "scotland",
      ]);
    });

    it("should throw error when there are no items matching regex ", async () => {
      try {
        expect(await dropDown("Cars").select(/Renault/));
      } catch (err) {
        expect(err.message).to.equal(
          "Option /Renault/ not available in drop down",
        );
      }
    });
  });

  describe("Parameters validation", () => {
    it("should throw a TypeError when an ElementWrapper is passed as argument", async () => {
      expect(() => dropDown($("div"))).to.throw(
        "You are passing a `ElementWrapper` to a `dropDown` selector. Refer https://docs.taiko.dev/api/dropdown/ for the correct parameters",
      );
    });

    it("should throw error for null values", async () => {
      try {
        expect(await dropDown("Cars").select(null));
      } catch (err) {
        expect(err.message).to.equal("Option null not available in drop down");
      }
    });

    it("should throw error for undefined values", async () => {
      try {
        expect(await dropDown("Cars").select(undefined));
      } catch (err) {
        expect(err.message).to.equal(
          "Option undefined not available in drop down",
        );
      }
    });
  });
});
