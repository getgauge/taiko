const expect = require('chai').expect;
let {
  openBrowser,
  radioButton,
  closeBrowser,
  goto,
  button,
  click,
  setConfig,
} = require('../../lib/taiko');
let {
  createHtml,
  removeFile,
  openBrowserArgs,
} = require('./test-util');

const test_name = 'radio button';

describe(test_name, () => {
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
      '<input type="radio" id="someRadioButton" name="testRadioButton" value="someRadioButton">someRadioButton</input>' +
      '<button id="panel" style="display:none">show on check</button>' +
      '<script>' +
      'var elem = document.getElementById("radioButtonWithInlineLabel");' +
      'elem.addEventListener("click", myFunction);' +
      'function myFunction() {' +
      'document.getElementById("panel").style.display = "block";' +
      '}</script>';
    filePath = createHtml(innerHtml, 'radioButton');
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
      expect(await radioButton('radioButtonWithInlineLabel').exists())
        .to.be.true;
      const elems = await radioButton('Something').elements();
      expect(await elems[0].exists()).to.be.false;
    });

    it('test get()', async () => {
      const elem = (await radioButton('radioButtonWithInlineLabel').get())[0];
      expect(await elem.get()).to.be.a('number');
    });

    it('test select()', async () => {
      await radioButton('radioButtonWithInlineLabel').select();
      let isSelected = await radioButton('radioButtonWithInlineLabel').isSelected();
      expect(isSelected).to.be.true;
    });

    it('test select() triggers events', async () => {
      await radioButton('radioButtonWithInlineLabel').select();
      expect(await button('show on check').exists()).to.be.true;
    });

    it('test deselect()', async () => {
      await radioButton('radioButtonWithInlineLabel').select();
      await radioButton('radioButtonWithInlineLabel').deselect();
      let isSelected = await radioButton('radioButtonWithInlineLabel').isSelected();
      expect(isSelected).to.be.false;
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

    it('test get()', async () => {
      const elem = (await radioButton('radioButtonWithWrappedLabel').get())[0];
      expect(
        await elem.get(),
      ).to.be.a('number');
    });

    it('test description', async () => {
      const description = radioButton('radioButtonWithWrappedLabel').description;
      expect(description).to.be.eql('Radio button with label radioButtonWithWrappedLabel ');
    });
  });

  describe('using label for', () => {
    it('test exists()', async () => {
      expect(await radioButton('radioButtonWithLabelFor').exists()).to
        .be.true;
    });
    
    it('test get()', async () => {
      const elem = (await radioButton('radioButtonWithLabelFor').get())[0];
      expect(await elem.get()).to.be.a('number');
    });

    it('test description', async () => {
      const description = radioButton('radioButtonWithLabelFor').description;
      expect(description).to.be.eql('Radio button with label radioButtonWithLabelFor ');
    });
  });

  describe('elements()', () => {
    it('test get of elements', async () => {
      const elements = await radioButton({
        id: 'someRadioButton',
      }).elements();
      expect(await elements[0].get()).to.be.a('number');
    });

    it('test exists of elements', async () => {
      let elements = await radioButton({
        id: 'someRadioButton',
      }).elements();
      expect(await elements[0].exists()).to.be.true;
      elements = await radioButton('someFileField').elements();
      expect(await elements[0].exists()).to.be.false;
    });

    it('test description of elements', async () => {
      let elements = await radioButton({
        id: 'someRadioButton',
      }).elements();
      expect(elements[0].description).to.be.eql(
        'Radio button[@id = concat(\'someRadioButton\', "")]',
      );
    });
  });
});
