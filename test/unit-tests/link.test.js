const expect = require('chai').expect;
let {
  openBrowser,
  closeBrowser,
  goto,
  link,
  toRightOf,
  setConfig,
    toLeftOf,
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
        </p>
        <p>
            Click1 <a id="hiddenLinkID" href="redirect1" style="display:none">HiddenLink</a> to trigger a redirect.
        </p>
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
      expect(await link({id:'hiddenLinkID'},{selectHiddenElement: true }).exists()).to.be.true;
    });
    it('should find the link for Hidden Elements with Text', async () => {
      expect(await link('HiddenLink',{selectHiddenElement: true }).exists()).to.be.true;
    });
  });
});
