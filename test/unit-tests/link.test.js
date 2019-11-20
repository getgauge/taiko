const expect = require('chai').expect;
let {
  openBrowser,
  closeBrowser,
  goto,
  link,
  toRightOf,
  setConfig,
} = require('../../lib/taiko');
let {
  createHtml,
  removeFile,
  openBrowserArgs,
} = require('./test-util');
const test_name = 'link';

describe(test_name, () => {
  let filePath;
  before(async () => {
    let innerHtml = `
        <p>
            Click <a id="redirect" href="redirect">here</a> to trigger a redirect.
            <a href="link1">similarLink1</a>
            <a href="link2">similarLink2</a>
            <a href="link3">similarLink3</a>
        </p>
        <p>
            Test <a id="hiddenLinkID" href="redirect1" style="display:none">HiddenLink</a> to trigger a redirect.
        </p>
        
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

  describe('link exists in page', () => {
    it('should find the link with text', async () => {
      expect(await link('here').exists()).to.be.true;
    });
    it('should find the link with id', async () => {
      expect(await link({ id: 'redirect' }).exists()).to.be.true;
    });
    it('should find the link with proximity selector', async () => {
      expect(await link(toRightOf('Click')).exists()).to.be.true;
    });
    it('should find the link for Hidden Elements with ID', async () => {
      expect(
        await link(
          { id: 'hiddenLinkID' },
          { selectHiddenElement: true },
        ).exists(),
      ).to.be.true;
    });
    it('should find the link for Hidden Elements with Text', async () => {
      expect(
        await link('HiddenLink', {
          selectHiddenElement: true,
        }).exists(),
      ).to.be.true;
    });
  });

  describe('link description in page', () => {
    it('should find the link with text', async () => {
      expect(link('here').description).to.be.eql(
        'link with text here ',
      );
    });
    it('should find the link with id', async () => {
      expect(link({ id: 'redirect' }).description).to.be.eql(
        'link[@id = concat(\'redirect\', "")]',
      );
    });
    it('should find the link with proximity selector', async () => {
      expect(link(toRightOf('Click')).description).to.be.eql(
        'link To right of Click',
      );
    });
  });

  describe('link text in page', () => {
    it('should find the link with text', async () => {
      expect(await link('here').text()).to.be.eql('here');
    });
    it('should find the link with id', async () => {
      expect(await link({ id: 'redirect' }).text()).to.be.eql('here');
    });
    it('should find the link with proximity selector', async () => {
      expect(await link(toRightOf('Click')).text()).to.be.eql('here');
    });
  });

  describe('test elementsList properties', () => {
    it('test get of elements', async () => {
      const elements = await link('similarLink').elements();
      expect(await elements[0].get()).to.be.a('number');
    });

    it('test description of elements', async () => {
      let elements = await link('similarLink').elements();
      expect(elements[0].description).to.be.eql(
        'link with text similarLink ',
      );
    });

    it('test text of elements', async () => {
      let elements = await link('similarLink').elements();
      expect(await elements[0].text()).to.be.eql('similarLink1');
      expect(await elements[1].text()).to.be.eql('similarLink2');
      expect(await elements[2].text()).to.be.eql('similarLink3');
    });
  });
});
