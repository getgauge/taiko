const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let {
  openBrowser,
  radioButton,
  closeBrowser,
  goto,
  button,
  click,
  setConfig,
} = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs, resetConfig } = require('./test-util');

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
      '<input name="hiddenRadioButton" type="radio" id="hiddenRadioButton" value="hiddenRadioButton">hiddenRadioButton</input>' +
      '<input type="reset" value="Reset">' +
      '</form>' +
      '<input type="radio" id="someRadioButton" name="testRadioButton" value="someRadioButton">someRadioButton</input>' +
      '<button id="panel" style="display:none">show on check</button>' +
      '<script>' +
      'document.getElementById("hiddenRadioButton").style.display = "none";' +
      'var elem = document.getElementById("radioButtonWithInlineLabel");' +
      'elem.addEventListener("click", myFunction);' +
      'function myFunction() {' +
      'document.getElementById("panel").style.display = "block";' +
      '}</script>';
    filePath = createHtml(innerHtml, 'radioButton');
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
      expect(await radioButton('radioButtonWithInlineLabel').exists()).to.be.true;
      expect(await radioButton('Something').exists()).to.be.false;
    });

    it('test select()', async () => {
      await radioButton('radioButtonWithInlineLabel').select();
      let isSelected = await radioButton('radioButtonWithInlineLabel').isSelected();
      expect(isSelected).to.be.true;
    });

    it('test select() should throw if the element is not found', async () => {
      await expect(radioButton('foo').select()).to.be.eventually.rejected;
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

    it('test deselect() should throw error if the element is not found', async () => {
      await expect(radioButton('foo').deselect()).to.be.eventually.rejected;
    });

    it('test isSelected()', async () => {
      await radioButton('radioButtonWithInlineLabel').select();
      expect(await radioButton('radioButtonWithInlineLabel').isSelected()).to.be.true;
    });

    it('test isSelected() to throw error if the element is not found', async () => {
      await expect(radioButton('foo').isSelected()).to.be.eventually.rejectedWith('');
    });

    it('test text should throw if the element is not found', async () => {
      await expect(radioButton('.foo').text()).to.be.eventually.rejectedWith('');
    });
  });

  describe('wrapped in label', () => {
    it('test exists()', async () => {
      expect(await radioButton('radioButtonWithWrappedLabel').exists()).to.be.true;
    });

    it('test description', async () => {
      const description = radioButton('radioButtonWithWrappedLabel').description;
      expect(description).to.be.eql('Radio button with label radioButtonWithWrappedLabel ');
    });
  });

  describe('with hidden style', () => {
    it('should find hidden radio buttons', async () => {
      expect(
        await radioButton('hiddenRadioButton', {
          selectHiddenElement: true,
        }).exists(),
      ).to.be.true;
    });

    it('should return true for non hidden element when isVisible fn is called on button', async () => {
      expect(await radioButton('radioButtonWithWrappedLabel').isVisible()).to.be.true;
    });

    it('should return false for hidden element when isVisible fn is called on textBox', async () => {
      expect(
        await radioButton({ id: 'hiddenRadioButton' }, { selectHiddenElement: true }).isVisible(),
      ).to.be.false;
    });
  });

  describe('using label for', () => {
    it('test exists()', async () => {
      expect(await radioButton('radioButtonWithLabelFor').exists()).to.be.true;
    });

    it('test description', async () => {
      const description = radioButton('radioButtonWithLabelFor').description;
      expect(description).to.be.eql('Radio button with label radioButtonWithLabelFor ');
    });
  });

  describe('test elementList properties', () => {
    it('test get of elements', async () => {
      const elements = await radioButton({
        id: 'someRadioButton',
      }).elements();
      expect(elements[0].get())
        .to.be.a('number')
        .above(0);
    });

    it('test description of elements', async () => {
      let elements = await radioButton({
        id: 'someRadioButton',
      }).elements();
      expect(elements[0].description).to.be.eql(
        'Radio button[@id = concat(\'someRadioButton\', "")]',
      );
    });

    it('test isSelected of elements', async () => {
      let elements = await radioButton({
        id: 'someRadioButton',
      }).elements();
      expect(await elements[0].isSelected()).to.be.false;
    });

    it('test select of elements', async () => {
      let elements = await radioButton({
        id: 'someRadioButton',
      }).elements();
      await elements[0].select();
      expect(await elements[0].isSelected()).to.be.true;
    });

    it('test deselect of elements', async () => {
      let elements = await radioButton({
        id: 'someRadioButton',
      }).elements();
      await elements[0].deselect();
      expect(await elements[0].isSelected()).to.be.false;
    });
  });
});
