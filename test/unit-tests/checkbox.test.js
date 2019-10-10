const expect = require('chai').expect;
let {
  createHtml,
  removeFile,
  openBrowserArgs,
} = require('./test-util');
let {
  openBrowser,
  goto,
  checkBox,
  closeBrowser,
  button,
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
      '<label>' +
      '<input name="testCheckbox" type="checkbox" value="checkboxWithWrappedInLabel" />' +
      '<span>checkboxWithWrappedInLabel</span>' +
      '</label>' +
      '<p>' +
      '<input id="checkboxWithLabelFor" name="testCheckbox" type="checkbox" value="checkboxWithLabelFor" />' +
      '<label for="checkboxWithLabelFor">checkboxWithLabelFor</label>' +
      '</p>' +
      '<input type="reset" value="Reset">' +
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
    await setConfig({ waitForNavigation: false });
  });

  after(async () => {
    await setConfig({ waitForNavigation: true });
    await closeBrowser();
    removeFile(filePath);
  });

  describe('with inline text', () => {
    afterEach(async () => {
      await click('Reset');
    });

    it('test exists()', async () => {
      expect(await checkBox('checkboxWithInlineLabel').exists()).to.be.true;
      const elems = await checkBox('Something').elements();
      expect(await elems[0].exists()).to.be.false;
    });

    it('test get()', async () => {
      const elem = (await checkBox('checkboxWithInlineLabel').get())[0];
      expect(await elem.get()).to.be.a("number");
    });

    it('test description', async () => {
      const description = checkBox('checkboxWithInlineLabel').description;
      expect(description).to.be.eql("Checkbox with label checkboxWithInlineLabel ");
    });

    it('test check()', async () => {
      await checkBox('checkboxWithInlineLabel').check();
      const isChecked = await checkBox('checkboxWithInlineLabel').isChecked();
      expect(isChecked).to.be.true;
    });

    it('test check() triggers events', async () => {
      await checkBox('checkboxWithInlineLabel').check();
      expect(await button('show on check').exists()).to.be.true;
    });

    it('test uncheck()', async () => {
      await checkBox('checkboxWithInlineLabel').check();
      await checkBox('checkboxWithInlineLabel').uncheck();
      const isChecked = await checkBox('checkboxWithInlineLabel').isChecked();
      expect(isChecked).to.be.false;
    });

    it('test isChecked()', async () => {
      await checkBox('checkboxWithInlineLabel').check();
      expect(await checkBox('checkboxWithInlineLabel').isChecked()).to
        .be.true;
    });
  });

  describe('wrapped in label', () => {
    it('test exists()', async () => {
      expect(await checkBox('checkboxWithWrappedInLabel').exists()).to
        .be.true;
    });

    it('test get()', async () => {
      const elems = (await checkBox('checkboxWithWrappedInLabel').get());
      expect(await elems[0].get()).to.be.a("number");
    });

    it('test description', async () => {
      const description = checkBox('checkboxWithWrappedInLabel').description;
      expect(description).to.be.eql("Checkbox with label checkboxWithWrappedInLabel ");
    });
  });

  describe('using label for', () => {
    it('test exists()', async () => {
      expect(await checkBox('checkboxWithLabelFor').exists()).to.be
        .true;
    });

    it('test get()', async () => {
      const elems = await checkBox('checkboxWithLabelFor').get();
      expect(await elems[0].get()).to.be.a("number");
    });

    it('test description', async () => {
      const description = checkBox('checkboxWithLabelFor').description;
      expect(description).to.be.eql("Checkbox with label checkboxWithLabelFor ");
    });
  });

  describe('elements()', () => {
    it('test get of elements', async () => {
      const elements = await checkBox({
        id: 'someCheckBox',
      }).elements();
      expect(await elements[0].get()).to.be.a('number');
    });

    it('test exists of elements', async () => {
      let elements = await checkBox({
        id: 'someCheckBox',
      }).elements();
      expect(await elements[0].exists()).to.be.true;
      elements = await checkBox('someFileField').elements();
      expect(await elements[0].exists()).to.be.false;
    });

    it('test description of elements', async () => {
      let elements = await checkBox({
        id: 'someCheckBox',
      }).elements();
      expect(elements[0].description).to.be.eql(
        'Checkbox[@id = concat(\'someCheckBox\', "")]',
      );
    });
  });
});
