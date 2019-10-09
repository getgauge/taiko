const expect = require('chai').expect;
let {
  openBrowser,
  closeBrowser,
  goto,
  $,
  text,
  above,
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
    await setConfig({ waitForNavigation: false });
  });

  after(async () => {
    await setConfig({ waitForNavigation: true });
    await closeBrowser();
    removeFile(filePath);
  });

  describe('text with xpath', () => {
    it('should find text with xpath', async () => {
      expect(await $("//*[text()='taiko']").exists()).to.be.true;
    });

    it('test get with xpath', async () => {
      expect(await $("//*[text()='taiko']").get()).to.have.lengthOf(1);
    });

    it('test description with xpath', async () => {
      expect($("//*[text()='taiko']").description).to.be.eql("Custom selector $(//*[text()=\'taiko\'])");
    });

    it('test text() with xpath', async () => {
      expect(await $("//*[text()='taiko']").text()).to.be.eql("taiko");
    });

    it('should find text with selectors', async () => {
      expect(await $('#foo').exists()).to.be.true;
      expect(await $('.test').exists()).to.be.true;
    });

    it('test get with selectors', async () => {
      expect(await $('#foo').get()).to.have.lengthOf(1);
      expect(await $('.test').get()).to.have.lengthOf(1);
    });

    it('test description with selectors', async () => {
      expect($('#foo').description).to.be.eql("Custom selector $(#foo)");
      expect($('.test').description).to.be.eql("Custom selector $(.test)");
    });

    it('test description with selectors', async () => {
      expect(await $('#foo').text()).to.be.eql("taiko");
      expect(await $('.test').text()).to.be.eql('taiko\n\ndemo');
    });
  });

  describe("test elements()",()=>{
    it('test get()', async () => {
      const elems = await $('#foo').elements();
      expect(await elems[0].get()).to.be.a('number');
    });

    it('test exists()', async () => {
      let elems = await $('#foo').elements();
      expect(await elems[0].exists()).to.be.true;
      elems = await $('#bar').elements();
      expect(elems).to.have.lengthOf(0);
    });

    it('test description', async () => {
      const elems = await $('#foo').elements();
      expect(elems[0].description).to.be.eql('Custom selector $(#foo)');
    });

    it('test text()', async () => {
      const elems = await $('#foo').elements();
      expect(await elems[0].text()).to.be.eql('taiko');
    });
  })
});
