const expect = require('chai').expect;
let {
  openBrowser,
  radioButton,
  closeBrowser,
  evaluate,
  $,
  goto,
  text,
  click,
  setConfig,
} = require('../../lib/taiko');
let {
  createHtml,
  removeFile,
  openBrowserArgs,
} = require('./test-util');

describe('radio button', () => {
  let filePath;
  before(async () => {
    let innerHtml =
      '<form>' +
      '<input type="radio" id="radioButtonWithInlineLabel" name="testRadioButton" value="radioButtonWithInlineLabel">radioButtonWithInlineLabel</input>' +
      '<label>' +
      '<input name="testRadioButton" type="radio" value="radioButtonWithWrappedLabel"/>' +
      '<span>radioButtonWithWrappedLabel</span>' +
      '</label>' +
      '<p>' +
      '<input id="radioButtonWithLabelFor" name="testRadioButton" type="radio" value="radioButtonWithLabelFor"/>' +
      '<label for="radioButtonWithLabelFor">radioButtonWithLabelFor</label>' +
      '</p>' +
      '<input type="reset" value="Reset">' +
      '</form>' +
      '<div id="panel" style="display:none">show on check</div>' +
      '<script>' +
      'var elem = document.getElementById("radioButtonWithInlineLabel");' +
      'elem.addEventListener("click", myFunction);' +
      'function myFunction() {' +
      'document.getElementById("panel").style.display = "block";' +
      '}</script>';
    filePath = createHtml(innerHtml, 'radioButton');
    await openBrowser(openBrowserArgs);
    await goto(filePath);
    setConfig({ waitForNavigation: false });
  });

  after(async () => {
    setConfig({ waitForNavigation: true });
    await closeBrowser();
    removeFile(filePath);
  });

  describe('with inline text', () => {
    afterEach(async () => {
      await click('Reset');
    });

    it('test exists()', async () => {
      expect(await radioButton('radioButtonWithInlineLabel').exists())
        .to.be.true;
      expect(await radioButton('Something').exists(0, 0)).to.be.false;
    });

    it('test select()', async () => {
      await radioButton('radioButtonWithInlineLabel').select();
      let value = await evaluate(
        $('input[name=testRadioButton]:checked'),
        element => element.value,
      );
      expect(value).to.equal('radioButtonWithInlineLabel');
    });

    it('test select() triggers events', async () => {
      await radioButton('radioButtonWithInlineLabel').select();
      expect(await text('show on check').exists()).to.be.true;
    });

    it('test deselect()', async () => {
      await radioButton('radioButtonWithInlineLabel').select();
      await radioButton('radioButtonWithInlineLabel').deselect();
      let value = await evaluate(
        $('input[value=radioButtonWithInlineLabel]'),
        element => element.checked,
      );
      expect(value).to.be.false;
    });

    it('test isSelected()', async () => {
      await radioButton('radioButtonWithInlineLabel').select();
      expect(
        await radioButton('radioButtonWithInlineLabel').isSelected(),
      ).to.be.true;
    });
  });

  describe('wrapped in label', () => {
    it('test exists()', async () => {
      expect(
        await radioButton('radioButtonWithWrappedLabel').exists(),
      ).to.be.true;
    });
  });

  describe('using label for', () => {
    it('test exists()', async () => {
      expect(await radioButton('radioButtonWithLabelFor').exists()).to
        .be.true;
    });
  });
});
