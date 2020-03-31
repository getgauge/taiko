const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let {
  openBrowser,
  goto,
  timeField,
  closeBrowser,
  write,
  into,
  setConfig,
  above,
  press,
} = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs, resetConfig } = require('./test-util');
const test_name = 'timeField';

describe(test_name, () => {
  before(async () => {
    await openBrowser(openBrowserArgs);
  });

  after(async () => {
    await closeBrowser();
  });

  var inputTypes = [
    {
      type: 'date',
      name: 'inputType-date',
      testValue: '12092020',
      testActualValue: '2020-09-12',
    },
    {
      type: 'month',
      name: 'inputType-month',
      testValue: 'May',
      testYear: '2018',
      testActualValue: '2018-05',
    },
    {
      type: 'week',
      name: 'inputType-week',
      testValue: '182018',
      testActualValue: '2018-W18',
    },
    { type: 'time', name: 'inputType-time', testValue: '1230AM', testActualValue: '00:30' },
    {
      type: 'datetime-local',
      name: 'inputType-datetime-local',
      testValue: '12090020180606AM',
      testActualValue: '2018-09-12T06:06',
    },
  ];

  inputTypes.forEach((inputType) => {
    describe('input with type ' + inputType.type, () => {
      let filePath;
      before(async () => {
        let innerHtml = `
                <div>
                    <form name="${inputType.name}">
                        <div name="withInlineText">
                            <input type="${inputType.type}">With Inline Text</input>
                        </div>
                        <div name="withWrappedLabel">
                            <label>
                                <input type="${inputType.type}"/>
                                <span>With Wrapped Label</span>
                            </label>
                        </div>
                        <div name="withLabelFor">
                            <label for="${inputType.name}WithLabelFor">With Label For</label>
                            <input id="${inputType.name}WithLabelFor" type="${inputType.type}"/>
                        </div>
                        <div>
                            <input type="${inputType.type}" id="sample${inputType.type}" value="${inputType.testActualValue}">With Inline Text</input>
                        </div>
                    </form>
                </div>`;
        filePath = createHtml(innerHtml, test_name + inputType.type);
        await goto(filePath);
        setConfig({
          waitForNavigation: false,
          retryTimeout: 100,
          retryInterval: 10,
        });
      });

      after(() => {
        resetConfig();
        removeFile(filePath);
      });

      describe('with inline text', () => {
        it('test exists()', async () => {
          expect(await timeField('With Inline Text').exists()).to.be.true;
        });

        it('test value()', async () => {
          await write(inputType.testValue, into(timeField('With Inline Text')));
          if (inputType.type === 'month') {
            await press('Tab');
            await write(inputType.testYear, timeField('With Inline Text'));
          }
          expect(await timeField('With Inline Text').value()).to.equal(inputType.testActualValue);
        });

        it('test description', async () => {
          expect(timeField('With Inline Text').description).to.be.eql(
            'Time field with label With Inline Text ',
          );
        });
      });

      describe('wrapped in label', () => {
        it('test exists()', async () => {
          expect(await timeField('With Wrapped Label').exists()).to.be.true;
        });

        it('test value()', async () => {
          await write(inputType.testValue, into(timeField('With Wrapped Label')));
          if (inputType.type === 'month') {
            await press('Tab');
            await write(inputType.testYear, timeField('With Wrapped Labe'));
          }
          expect(await timeField('With Wrapped Label').value()).to.equal(inputType.testActualValue);
        });

        it('test description', async () => {
          expect(timeField('With Wrapped Label').description).to.be.eql(
            'Time field with label With Wrapped Label ',
          );
        });
      });

      describe('using label for', () => {
        it('test exists()', async () => {
          expect(await timeField('With Label For').exists()).to.be.true;
        });

        it('test value()', async () => {
          await write(inputType.testValue, into(timeField('With Label For')));
          if (inputType.type === 'month') {
            await press('Tab');
            await write(inputType.testYear, timeField('With Label For'));
          }
          expect(await timeField('With Label For').value()).to.equal(inputType.testActualValue);
        });

        it('test description', async () => {
          expect(timeField('With Label For').description).to.be.eql(
            'Time field with label With Label For ',
          );
        });
      });

      describe('attribute and value pair', () => {
        it('test exists()', async () => {
          expect(
            await timeField({
              id: inputType.name + 'WithLabelFor',
            }).exists(),
          ).to.be.true;
        });

        it('test value()', async () => {
          expect(
            await timeField({
              id: inputType.name + 'WithLabelFor',
            }).value(),
          ).to.equal(inputType.testActualValue);
        });

        it('test description', async () => {
          expect(
            timeField({
              id: inputType.name + 'WithLabelFor',
            }).description,
          ).to.be.eql(`Time field[@id = concat('inputType-${inputType.type}WithLabelFor', "")]`);
        });
      });

      describe('with relative selector', () => {
        it('test exists()', async () => {
          expect(await timeField(above('With Label For')).exists()).to.be.true;
        });

        it('test value()', async () => {
          expect(await timeField(above('With Label For')).value()).to.equal(
            inputType.testActualValue,
          );
        });

        it('test description', async () => {
          expect(timeField(above('With Label For')).description).to.be.eql(
            'Time field Above With Label For',
          );
        });
      });

      describe('test elementsList properties', () => {
        it('test get of elements', async () => {
          const elements = await timeField({
            id: `sample${inputType.type}`,
          }).elements();
          expect(elements[0].get()).to.be.a('number').above(0);
        });

        it('test description of elements', async () => {
          let elements = await timeField({
            id: `sample${inputType.type}`,
          }).elements();
          expect(elements[0].description).to.be.eql(
            `Time field[@id = concat('sample${inputType.type}', "")]`,
          );
        });

        it('test value of elements', async () => {
          let elements = await timeField({
            id: `sample${inputType.type}`,
          }).elements();
          expect(await elements[0].value()).to.be.eql(`${inputType.testActualValue}`);
        });
      });
    });
  });
});
