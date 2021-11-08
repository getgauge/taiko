const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let { createHtml, removeFile, openBrowserArgs, resetConfig } = require('./test-util');
let {
  openBrowser,
  goto,
  checkBox,
  closeBrowser,
  text,
  click,
  setConfig,
  $,
  evaluate,
} = require('../../lib/taiko');
const { xpath } = require('../../lib/helper');

const test_name = 'Checkbox';

const inputType = { type: 'checkbox', testDescription: test_name };
const inputTypeCaseSensitive = {
  type: 'ChECkBox',
  testDescription: `${test_name} case insensitive selector`,
};

[inputType, inputTypeCaseSensitive].forEach((inputType) =>
  describe(inputType.testDescription, () => {
    const type = inputType.type;

    let filePath;
    before(async () => {
      let innerHtml =
        `<script>
     
        class ShadowButton extends HTMLElement {
          constructor() {
            super();
            var shadow = this.attachShadow({mode: 'open'});
    
            var button = document.createElement('input');
            button.setAttribute('type', '${type}');
            button.setAttribute('id', 'Shadow Click');
            button.addEventListener("click", event => {
              alert("Hello from the shadows");
            });
            shadow.appendChild(button);

            var hiddenButton = document.createElement('input');
            hiddenButton.setAttribute('type', '${type}');
            hiddenButton.setAttribute('id', 'HiddenShadowButton');
            hiddenButton.setAttribute('style','display:none');
            shadow.appendChild(hiddenButton);
            
          }
        }
        customElements.define('shadow-button', ShadowButton);
      </script>` +
        ' <shadow-button></shadow-button>' +
        '<form>' +
        `<input type="${type}" id="checkboxWithInlineLabel" name="testCheckbox" value="checkboxWithInlineLabel">checkboxWithInlineLabel</input>` +
        `<input type="${type}" style="display: none" id="hiddenCheckbox" name="testCheckbox" value="hiddenCheckbox">hiddenCheckbox</input>` +
        '<label>' +
        `<input name="testCheckbox" type="${type}" value="checkboxWithWrappedInLabel" />` +
        '<span>checkboxWithWrappedInLabel</span>' +
        '</label>' +
        '<p>' +
        `<input id="checkboxWithLabelFor" name="testCheckbox" type="${type}" value="checkboxWithLabelFor" />` +
        '<label for="checkboxWithLabelFor">checkboxWithLabelFor</label>' +
        '</p>' +
        '<input type="reset" value="Reset" />' +
        '</form>' +
        '<button id="panel" style="display:none">show on check</button>' +
        `<input type="${type}" id="someCheckBox" name="testCheckbox" value="someCheckBox">someCheckBox</input>` +
        '<script>' +
        'var elem = document.getElementById("checkboxWithInlineLabel");' +
        'elem.addEventListener("click", myFunction);' +
        'function myFunction() {' +
        'document.getElementById("panel").style.display = "block";' +
        '}</script>';
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

    describe('with inline text', () => {
      afterEach(async () => {
        await click('Reset');
      });

      it('test exists()', async () => {
        expect(await checkBox('checkboxWithInlineLabel').exists()).to.be.true;
        expect(await checkBox('Something').exists(0, 0)).to.be.false;
      });

      it('test description', async () => {
        const description = checkBox('checkboxWithInlineLabel').description;
        expect(description).to.be.eql('CheckBox with label checkboxWithInlineLabel ');
      });

      it('test check()', async () => {
        await checkBox('checkboxWithInlineLabel').check();
        const isChecked = await checkBox('checkboxWithInlineLabel').isChecked();
        expect(isChecked).to.be.true;
      });

      it('test check() to throw if the element is not found', async () => {
        await expect(checkBox('foo').check()).to.be.eventually.rejected;
      });

      it('test check() triggers events', async () => {
        await checkBox('checkboxWithInlineLabel').check();
        expect(await text('show on check').exists()).to.be.true;
      });

      it('test uncheck()', async () => {
        await checkBox('checkboxWithInlineLabel').check();
        await checkBox('checkboxWithInlineLabel').uncheck();
        const isChecked = await checkBox('checkboxWithInlineLabel').isChecked();
        expect(isChecked).to.be.false;
      });

      it('test uncheck() to throw if the element is not found', async () => {
        await expect(checkBox('foo').uncheck()).to.be.eventually.rejected;
      });

      it('test isChecked()', async () => {
        await checkBox('checkboxWithInlineLabel').check();
        expect(await checkBox('checkboxWithInlineLabel').isChecked()).to.be.true;
      });

      it('test isChecked() to throw if no element is found', async () => {
        await expect(checkBox('foo').isChecked()).to.be.eventually.rejected;
      });

      it('test text should throw if the element is not found', async () => {
        await expect(checkBox('.foo').text()).to.be.eventually.rejected;
      });

      it('test isVisible() to throw if no element is found', async () => {
        await expect(checkBox('foo').isVisible()).to.be.eventually.rejected;
      });

      it('inside shadow dom', async () => {
        expect(await checkBox({ id: 'Shadow Click' }).exists()).to.be.true;
      });
    });

    describe('xpath as a selector', () => {
      let xPath = '/html/body/form/input[1]';

      it('checking existence of the xpath', async () => {
        expect(await checkBox($(xPath)).exists()).to.be.true;
        expect(await checkBox($('foo')).exists()).to.be.false;
      });

      it('test description', async () => {
        const description = checkBox($(xPath)).description;
        expect(description).to.be.eql('CustomSelector with query ' + xPath + ' ');
      });

      it('test checking xpath', async () => {
        await checkBox($(xPath)).check();
        const isChecked = await checkBox($(xPath)).isChecked();
        expect(isChecked).to.be.true;
      });

      it('Test check() to reject if the xpath is not found', async () => {
        await !expect(checkBox($('foo')).check()).to.be.eventually.rejected;
      });

      it('Test uncheck() to reject if the xpath is not found', async () => {
        await expect(checkBox($('foo')).uncheck()).to.be.eventually.rejected;
      });

      it('Test isChecked() to reject if the xpath is not found', async () => {
        await expect(checkBox($('foo')).isChecked()).to.be.eventually.rejected;
      });

      it('Test text() to reject if the xpath is not found', async () => {
        await expect(checkBox($('foo')).text()).to.be.eventually.rejected;
      });

      it('Test isVisible() to reject if the xpath is not found', async () => {
        await expect(checkBox($('foo')).isVisible()).to.be.eventually.rejected;
      });

      it('test uncheck() for an xpath', async () => {
        await checkBox($(xPath)).check();
        await checkBox($(xPath)).uncheck();
        const isChecked = await checkBox($(xPath)).isChecked();
        expect(isChecked).to.be.false;
      });

      it('test isChecked()', async () => {
        await checkBox($(xPath)).check();
        expect(await checkBox($(xPath)).isChecked()).to.be.true;
      });
    });

    describe('wrapped in label', () => {
      it('test exists()', async () => {
        expect(await checkBox('checkboxWithWrappedInLabel').exists()).to.be.true;
      });

      it('test description', async () => {
        const description = checkBox('checkboxWithWrappedInLabel').description;
        expect(description).to.be.eql('CheckBox with label checkboxWithWrappedInLabel ');
      });
    });

    describe('event bubble', () => {
      it('should emit events', async () => {
        await evaluate(() => {
          document.raisedEvents = [];
          var dropDown = document.getElementById('checkboxWithLabelFor');
          ['input', 'change', 'click'].forEach((ev) => {
            dropDown.addEventListener(ev, () => document.raisedEvents.push(ev));
          });
        });

        await checkBox('checkboxWithLabelFor').check();

        var events = await evaluate(() => document.raisedEvents);
        expect(events).to.eql(['change', 'input', 'click']);
      });
    });

    describe('using label for', () => {
      it('test exists()', async () => {
        expect(await checkBox('checkboxWithLabelFor').exists()).to.be.true;
      });

      it('test description', async () => {
        const description = checkBox('checkboxWithLabelFor').description;
        expect(description).to.be.eql('CheckBox with label checkboxWithLabelFor ');
      });
    });

    describe('test elementList properties', () => {
      it('test get of elements', async () => {
        const elements = await checkBox({
          id: 'someCheckBox',
        }).elements();
        expect(elements[0].get()).to.be.a('string');
      });

      it('test isVisible of elements', async () => {
        const elements = await checkBox({
          id: 'someCheckBox',
        }).elements();
        expect(await elements[0].isVisible()).to.be.true;
      });

      it('test description of elements', async () => {
        let elements = await checkBox({
          id: 'someCheckBox',
        }).elements();
        expect(elements[0].description).to.be.eql('CheckBox[id="someCheckBox"]');
      });

      it('test isChecked of elements', async () => {
        let elements = await checkBox({
          id: 'someCheckBox',
        }).elements();
        expect(await elements[0].isChecked()).to.be.false;
      });

      it('test check of elements', async () => {
        let elements = await checkBox({
          id: 'someCheckBox',
        }).elements();
        await elements[0].check();
        expect(await elements[0].isChecked()).to.be.true;
      });

      it('test uncheck of elements', async () => {
        let elements = await checkBox({
          id: 'someCheckBox',
        }).elements();
        await elements[0].uncheck();
        expect(await elements[0].isChecked()).to.be.false;
      });
    });

    describe('with hidden style', () => {
      it('test finding hidden checkbox elements', async () => {
        expect(await checkBox('hiddenCheckbox').exists()).to.be.true;
      });

      it('should return true for non hidden element when isVisible fn is called on checkbox', async () => {
        expect(await checkBox('someCheckBox').isVisible()).to.be.true;
      });

      it('should return false for hidden element when isVisible fn is called on shadow checkbox', async () => {
        expect(await checkBox({ id: 'HiddenShadowButton' }).isVisible()).to.be.false;
      });

      it('should return false for hidden element when isVisible fn is called on textBox', async () => {
        expect(await checkBox('hiddenCheckbox').isVisible()).to.be.false;
      });
    });
  }),
);

// describe('Parameters validation', () => {
//   let filePath;

//   before(async () => {
//     let innerHtml = `
//       <div id='prova' style='display:none'>Element Present</div>
//     `;
//     filePath = createHtml(innerHtml, test_name);
//     await openBrowser(openBrowserArgs);
//     await goto(filePath);
//     setConfig({
//       waitForNavigation: false,
//       retryTimeout: 100,
//       retryInterval: 10,
//     });
//   });
//   after(async () => {
//     resetConfig();
//     await closeBrowser();
//     removeFile(filePath);
//   });

//   it('should throw a TypeError when an ElementWrapper is passed as argument', async () => {
//     expect(() => checkBox($('div'))).to.throw(
//       'You are passing a `ElementWrapper` to a `checkBox` selector. Refer https://docs.taiko.dev/api/checkbox/ for the correct parameters',
//     );
//   });
// });
