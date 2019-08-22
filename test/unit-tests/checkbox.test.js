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
  evaluate,
  $,
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
      '<div id="panel" style="display:none">show on check</div>' +
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
      expect(await checkBox('checkboxWithInlineLabel').exists()).to.be
        .true;
      expect(await checkBox('Something').exists(0, 0)).to.be.false;
    });

    it('test check()', async () => {
      await checkBox('checkboxWithInlineLabel').check();
      let value = await evaluate($('input[name=testCheckbox]:checked'), (element) => element.value);
      expect(value).to.equal('checkboxWithInlineLabel');
    });

    it('test check() triggers events', async () => {
      await checkBox('checkboxWithInlineLabel').check();
      expect(await text('show on check').exists()).to.be.true;
    });

    it('test uncheck()', async () => {
      await checkBox('checkboxWithInlineLabel').check();
      await checkBox('checkboxWithInlineLabel').uncheck();
      let value = await evaluate($('input[value=checkboxWithInlineLabel]'), (element) => element.checked);
      expect(value).to.be.false;
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
  });

  describe('using label for', () => {
    it('test exists()', async () => {
      expect(await checkBox('checkboxWithLabelFor').exists()).to.be
        .true;
    });
  });
});
