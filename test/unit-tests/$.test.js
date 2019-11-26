const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let {
  openBrowser,
  closeBrowser,
  goto,
  $,
  setConfig,
} = require('../../lib/taiko');
let {
  createHtml,
  removeFile,
  openBrowserArgs,
} = require('./test-util');
const test_name = '$';

describe(test_name, () => {
  let filePath;
  before(async () => {
    let innerHtml = `
        <div class="test">
            <p id="foo">taiko</p>
            <p>demo</p>
        </div>
            `;
    filePath = createHtml(innerHtml, test_name);
    await openBrowser(openBrowserArgs);
    await goto(filePath);
    setConfig({ waitForNavigation: false });
  });

  after(async () => {
    setConfig({ waitForNavigation: true });
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
      expect(await $("//*[text()='taiko']").text()).to.be.eql(
        'taiko',
      );
    });
  });

  describe('test with selectors', () => {
    it('should find text with selectors', async () => {
      expect(await $('#foo').exists()).to.be.true;
      expect(await $('.test').exists()).to.be.true;
    });

    it('test description with selectors', async () => {
      expect($('#foo').description).to.be.eql(
        'Custom selector $(#foo)',
      );
      expect($('.test').description).to.be.eql(
        'Custom selector $(.test)',
      );
    });

    it('test text with selectors', async () => {
      expect(await $('#foo').text()).to.be.eql('taiko');
      expect(await $('.test').text()).to.be.eql('taiko\n\ndemo');
    });

    it('test text should throw if the element is not found', async () => {
      expect($('.foo').text()).to.be.eventually.rejected;
    });
  });

  describe('test elementList properties', () => {
    it('test get()', async () => {
      const elems = await $('#foo').elements();
      expect(elems[0].get())
        .to.be.a('number')
        .above(0);
    });

    it('test description', async () => {
      const elems = await $('#foo').elements();
      expect(elems[0].description).to.be.eql(
        'Custom selector $(#foo)',
      );
    });

    it('test text()', async () => {
      const elems = await $('#foo').elements();
      expect(await elems[0].text()).to.be.eql('taiko');
    });
  });
});
