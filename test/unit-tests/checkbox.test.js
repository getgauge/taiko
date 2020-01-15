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
} = require('../../lib/taiko');
const test_name = 'Checkbox';

describe(test_name, () => {
  let filePath;
  before(async () => {
    let innerHtml =
      '<form>' +
      '<input type="checkbox" id="checkboxWithInlineLabel" name="testCheckbox" value="checkboxWithInlineLabel">checkboxWithInlineLabel</input>' +
      '<input type="checkbox" style="display: none" id="hiddenCheckbox" name="testCheckbox" value="hiddenCheckbox">hiddenCheckbox</input>' +
      '<label>' +
      '<input name="testCheckbox" type="checkbox" value="checkboxWithWrappedInLabel" />' +
      '<span>checkboxWithWrappedInLabel</span>' +
      '</label>' +
      '<p>' +
      '<input id="checkboxWithLabelFor" name="testCheckbox" type="checkbox" value="checkboxWithLabelFor" />' +
      '<label for="checkboxWithLabelFor">checkboxWithLabelFor</label>' +
      '</p>' +
      '<input type="reset" value="Reset" />' +
      '</form>' +
      '<button id="panel" style="display:none">show on check</button>' +
      '<input type="checkbox" id="someCheckBox" name="testCheckbox" value="someCheckBox">someCheckBox</input>' +
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
      retryTimeout: 100,
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
      expect(await checkBox('Something').exists()).to.be.false;
    });

    it('test description', async () => {
      const description = checkBox('checkboxWithInlineLabel').description;
      expect(description).to.be.eql('Checkbox with label checkboxWithInlineLabel ');
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
  });

  describe('wrapped in label', () => {
    it('test exists()', async () => {
      expect(await checkBox('checkboxWithWrappedInLabel').exists()).to.be.true;
    });

    it('test description', async () => {
      const description = checkBox('checkboxWithWrappedInLabel').description;
      expect(description).to.be.eql('Checkbox with label checkboxWithWrappedInLabel ');
    });
  });

  describe('using label for', () => {
    it('test exists()', async () => {
      expect(await checkBox('checkboxWithLabelFor').exists()).to.be.true;
    });

    it('test description', async () => {
      const description = checkBox('checkboxWithLabelFor').description;
      expect(description).to.be.eql('Checkbox with label checkboxWithLabelFor ');
    });
  });

  describe('test elementList properties', () => {
    it('test get of elements', async () => {
      const elements = await checkBox({
        id: 'someCheckBox',
      }).elements();
      expect(elements[0].get())
        .to.be.a('number')
        .above(0);
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
      expect(elements[0].description).to.be.eql('Checkbox[@id = concat(\'someCheckBox\', "")]');
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
      expect(
        await checkBox('hiddenCheckbox', {
          selectHiddenElement: true,
        }).exists(),
      ).to.be.true;
    });

    it('should return true for non hidden element when isVisible fn is called on button', async () => {
      expect(await checkBox('someCheckBox').isVisible()).to.be.true;
    });

    it('should return false for hidden element when isVisible fn is called on textBox', async () => {
      expect(
        await checkBox('hiddenCheckbox', {
          selectHiddenElement: true,
        }).isVisible(),
      ).to.be.false;
    });
  });
});
