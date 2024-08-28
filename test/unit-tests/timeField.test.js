const chai = require("chai");
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const {
  openBrowser,
  goto,
  timeField,
  closeBrowser,
  setConfig,
  above,
  click,
  $,
} = require("../../lib/taiko");
const {
  createHtml,
  removeFile,
  openBrowserArgs,
  resetConfig,
} = require("./test-util");
const test_name = "timeField";

describe(test_name, () => {
  before(async () => {
    await openBrowser(openBrowserArgs);
  });

  after(async () => {
    await closeBrowser();
  });

  const getDateForTime = (hour, min) => {
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(min);
    return date;
  };

  const localDate = (YYYY, MM, DD, hh = 0, mm = 0, s = 0, ms = 0) => {
    const date = new Date();
    date.setFullYear(YYYY);
    date.setDate(DD);
    date.setMonth(MM - 1); // thanks JS for being dumb
    date.setHours(hh);
    date.setMinutes(mm);
    date.setSeconds(s);
    date.setMilliseconds(ms);
    return date;
  };

  const inputTypes = [
    {
      type: "date",
      name: "inputType-date",
      min: "2018-01-01",
      max: "2018-12-31",
      testValue: localDate(2018, 9, 12),
      testMinValue: new Date("2017-09-12"),
      testMaxValue: new Date("2021-09-12"),
      testDefaultValue: "2018-01-01",
      testActualValue: "2018-09-12",
    },
    {
      type: "month",
      name: "inputType-month",
      min: "2018-03",
      max: "2018-05",
      testValue: new Date("2018-05-05"),
      testMinValue: new Date("2017-09-12"),
      testMaxValue: new Date("2021-09-12"),
      testDefaultValue: "2018-03",
      testActualValue: "2018-05",
    },
    {
      type: "week",
      name: "inputType-week",
      min: "2018-W18",
      max: "2018-W26",
      testValue: new Date("2018-05-09"),
      testMinValue: new Date("2018-02-12"),
      testMaxValue: new Date("2018-09-12"),
      testDefaultValue: "2018-W18",
      testActualValue: "2018-W19",
    },
    {
      type: "time",
      name: "inputType-time",
      min: "09:00",
      max: "18:00",
      testValue: getDateForTime("09", "24"),
      testMinValue: getDateForTime("08", "24"),
      testMaxValue: getDateForTime("19", "24"),
      testDefaultValue: "09:00",
      testActualValue: "09:24",
    },
    {
      type: "datetime-local",
      name: "inputType-datetime-local",
      min: "2018-06-07T00:00",
      max: "2018-06-14T00:00",
      testValue: new Date("2018-06-09T12:30"),
      testMinValue: new Date("2018-05-09T12:30"),
      testMaxValue: new Date("2018-07-09T12:30"),
      testDefaultValue: "2018-06-07T00:00",
      testActualValue: "2018-06-09T12:30",
    },
  ];

  inputTypes.forEach((inputType) => {
    describe(`input with type ${inputType.type}`, () => {
      let filePath;
      before(async () => {
        const innerHtml = `
                <div>
                    <form name="${inputType.name}">
                        <div name="withInlineText">
                            <input type="${inputType.type}" value="${inputType.testDefaultValue}" min="${inputType.min}">With Inline Text</input>
                        </div>
                        <div name="withWrappedLabel">
                            <label>
                                <input type="${inputType.type}" value="${inputType.testDefaultValue}" max="${inputType.max}"/>
                                <span>With Wrapped Label</span>
                            </label>
                        </div>
                        <div name="withLabelFor">
                            <label for="${inputType.name}WithLabelFor">With Label For</label>
                            <input id="${inputType.name}WithLabelFor" type="${inputType.type}" value="${inputType.testDefaultValue}" min="${inputType.min}" max="${inputType.max}"/>
                        </div>
                        <div>
                            <input type="${inputType.type}" id="sample${inputType.type}" value="${inputType.testDefaultValue}">With Inline Text</input>
                        </div>
                        <div>
                         <input type="reset" value="Reset" />
                        </div>
                    </form>
                </div>`;
        filePath = createHtml(innerHtml, test_name + inputType.type);
        await goto(filePath);
        setConfig({
          waitForNavigation: false,
          retryTimeout: 10,
          retryInterval: 10,
        });
      });

      after(() => {
        resetConfig();
        removeFile(filePath);
      });

      afterEach(async () => {
        await click("Reset");
      });

      describe("with inline text", () => {
        it("test exists()", async () => {
          expect(await timeField("With Inline Text").exists()).to.be.true;
        });

        it("test value()", async () => {
          expect(await timeField("With Inline Text").value()).to.equal(
            inputType.testDefaultValue,
          );
        });

        it("test select()", async () => {
          await timeField("With Inline Text").select(inputType.testValue);
          expect(await timeField("With Inline Text").value()).to.equal(
            inputType.testActualValue,
          );
        });

        it("should throw error if less than min", async () => {
          await expect(
            timeField("With Inline Text").select(inputType.testMinValue),
          ).to.be.eventually.rejectedWith(
            `Value should be minimum of ${inputType.min}`,
          );
        });

        it("test description", async () => {
          expect(timeField("With Inline Text").description).to.be.eql(
            "TimeField with label With Inline Text ",
          );
        });
      });

      describe("wrapped in label", () => {
        it("test exists()", async () => {
          expect(await timeField("With Wrapped Label").exists()).to.be.true;
        });

        it("test value()", async () => {
          expect(await timeField("With Wrapped Label").value()).to.equal(
            inputType.testDefaultValue,
          );
        });

        it("test select()", async () => {
          await timeField("With Wrapped Label").select(inputType.testValue);
          expect(await timeField("With Wrapped Label").value()).to.equal(
            inputType.testActualValue,
          );
        });

        it("should throw error if greater than max", async () => {
          await expect(
            timeField("With Wrapped Label").select(inputType.testMaxValue),
          ).to.be.eventually.rejectedWith(
            `Value should be maximum of ${inputType.max}`,
          );
        });

        it("test description", async () => {
          expect(timeField("With Wrapped Label").description).to.be.eql(
            "TimeField with label With Wrapped Label ",
          );
        });
      });

      describe("using label for", () => {
        it("test exists()", async () => {
          expect(await timeField("With Label For").exists()).to.be.true;
        });

        it("test value()", async () => {
          expect(await timeField("With Label For").value()).to.equal(
            inputType.testDefaultValue,
          );
        });

        it("test select()", async () => {
          await timeField("With Label For").select(inputType.testValue);
          expect(await timeField("With Label For").value()).to.equal(
            inputType.testActualValue,
          );
        });

        it("test description", async () => {
          expect(timeField("With Label For").description).to.be.eql(
            "TimeField with label With Label For ",
          );
        });

        it("should throw error if value if greater than max", async () => {
          await expect(
            timeField("With Label For").select(inputType.testMaxValue),
          ).to.be.eventually.rejectedWith(
            `Value should be minimum of ${inputType.min} maximum of ${inputType.max}`,
          );
        });

        it("should throw error if value if lesser than min", async () => {
          await expect(
            timeField("With Label For").select(inputType.testMinValue),
          ).to.be.eventually.rejectedWith(
            `Value should be minimum of ${inputType.min} maximum of ${inputType.max}`,
          );
        });
      });

      describe("attribute and value pair", () => {
        it("test exists()", async () => {
          expect(
            await timeField({
              id: `${inputType.name}WithLabelFor`,
            }).exists(),
          ).to.be.true;
        });

        it("test value()", async () => {
          expect(
            await timeField({
              id: `${inputType.name}WithLabelFor`,
            }).value(),
          ).to.equal(inputType.testDefaultValue);
        });

        it("test select()", async () => {
          await timeField({
            id: `${inputType.name}WithLabelFor`,
          }).select(inputType.testValue);

          expect(
            await timeField({
              id: `${inputType.name}WithLabelFor`,
            }).value(),
          ).to.equal(inputType.testActualValue);
        });

        it("test description", async () => {
          expect(
            timeField({
              id: `${inputType.name}WithLabelFor`,
            }).description,
          ).to.be.eql(
            `TimeField[id="inputType-${inputType.type}WithLabelFor"]`,
          );
        });
      });

      describe("with relative selector", () => {
        it("test exists()", async () => {
          expect(await timeField(above("With Label For")).exists()).to.be.true;
        });

        it("test value()", async () => {
          expect(await timeField(above("With Label For")).value()).to.equal(
            inputType.testDefaultValue,
          );
        });

        it("test select()", async () => {
          await timeField(above("With Label For")).select(inputType.testValue);
          expect(await timeField(above("With Label For")).value()).to.equal(
            inputType.testActualValue,
          );
        });

        it("test description", async () => {
          expect(timeField(above("With Label For")).description).to.be.eql(
            "TimeField above With Label For",
          );
        });
      });

      describe("test elementsList properties", () => {
        it("test get of elements", async () => {
          const elements = await timeField({
            id: `sample${inputType.type}`,
          }).elements();
          expect(elements[0].get()).to.be.a("string");
        });

        it("test description of elements", async () => {
          const elements = await timeField({
            id: `sample${inputType.type}`,
          }).elements();
          expect(elements[0].description).to.be.eql(
            `TimeField[id="sample${inputType.type}"]`,
          );
        });

        it("test select()", async () => {
          const elements = await timeField({
            id: `sample${inputType.type}`,
          }).elements();
          await elements[0].select(inputType.testValue);
          expect(await elements[0].value()).to.equal(inputType.testActualValue);
        });

        it("test value of elements", async () => {
          const elements = await timeField({
            id: `sample${inputType.type}`,
          }).elements();
          expect(await elements[0].value()).to.be.eql(
            inputType.testDefaultValue,
          );
        });
      });
    });
  });

  describe("Parameters validation", () => {
    it("should throw a TypeError when an ElementWrapper is passed as argument", async () => {
      expect(() => timeField($("div"))).to.throw(
        "You are passing a `ElementWrapper` to a `timeField` selector. Refer https://docs.taiko.dev/api/timefield/ for the correct parameters",
      );
    });
  });
});
