const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let { openBrowser, closeBrowser, goto, $, setConfig } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs, resetConfig } = require('./test-util');
const test_name = '$';

describe(test_name, () => {
  let filePath;
  before(async () => {
    let innerHtml = `
        <div class="test">
            <p id="foo">taiko</p>
            <p>demo</p>
        </div>
        <div class="hiddenTest">
            <p id="hidden" style="display:none>taiko-hidden</p>
            <p>demo</p>
    </div>
            `;
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

  describe('text with xpath', () => {
    it('should find text with xpath', async () => {
      expect(await $("//*[text()='taiko']").exists()).to.be.true;
    });

    it('test description with xpath', async () => {
      expect($("//*[text()='taiko']").description).to.be.eql(
        "Custom selector $(//*[text()='taiko'])",
      );
    });

    it('test text() with xpath', async () => {
      expect(await $("//*[text()='taiko']").text()).to.be.eql('taiko');
    });

    it('should return true for non hidden element when isVisible fn is called', async () => {
      expect(await $("//*[text()='taiko']").isVisible()).to.be.true;
    });

    it('test isVisible() to throw if no element is found', async () => {
      await expect($("//*[text()='foo']").isVisible()).to.be.eventually.rejected;
    });

    //TODO $ API does not accept selectHiddenElement as options should be fixed #811
    it.skip('should return false for hidden element when isVisible fn is called on text', async () => {
      expect(
        await $('#taiko-hidden', {
          selectHiddenElement: true,
        }).isVisible(),
      ).to.be.false;
    });
  });

  describe('test with selectors', () => {
    it('should find text with selectors', async () => {
      expect(await $('#foo').exists()).to.be.true;
      expect(await $('.test').exists()).to.be.true;
    });

    it('should return true for non hidden element when isVisible fn is called on text', async () => {
      expect(await $('#foo').isVisible()).to.be.true;
    });

    it('test description with selectors', async () => {
      expect($('#foo').description).to.be.eql('Custom selector $(#foo)');
      expect($('.test').description).to.be.eql('Custom selector $(.test)');
    });

    it('test text with selectors', async () => {
      expect(await $('#foo').text()).to.be.eql('taiko');
      expect(await $('.test').text()).to.be.eql('taiko\n\ndemo');
    });

    it('test text should throw if the element is not found', async () => {
      await expect($('.foo').text()).to.be.eventually.rejectedWith(
        'Custom selector $(.foo) not found',
      );
    });
  });

  describe('test elementList properties', () => {
    it('test get()', async () => {
      const elems = await $('#foo').elements();
      expect(elems[0].get())
        .to.be.a('number')
        .above(0);
    });

    it('test isVisible of elements', async () => {
      const elements = await $('#foo').elements();
      expect(await elements[0].isVisible()).to.be.true;
    });

    it('test description', async () => {
      const elems = await $('#foo').elements();
      expect(elems[0].description).to.be.eql('Custom selector $(#foo)');
    });

    it('test text()', async () => {
      const elems = await $('#foo').elements();
      expect(await elems[0].text()).to.be.eql('taiko');
    });

    it('test text() with element index', async () => {
      const elems = await $('#foo').element(0);
      expect(await elems.text()).to.be.eql('taiko');
    });

    it('Should throw error when element index is out of bound', async () => {
      await $('#foo')
        .element(1)
        .catch(err => {
          expect(err).to.include(/Element index is out of range. There are only 1 element(s)/);
        });
    });
  });
});
