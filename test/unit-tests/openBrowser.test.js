const chai = require('chai');
const expect = chai.expect;
const rewire = require('rewire');
const taiko = rewire('../../lib/taiko');
let { openBrowser, closeBrowser, client } = taiko;

let { openBrowserArgs } = require('./test-util');
describe('OpenBrowser', () => {
  describe('opens browser successfully', () => {
    xit("openBrowser should return 'Browser Opened' message", async () => {
      expect(process.env.TAIKO_EMULATE_DEVICE).to.be.undefined;
      await openBrowser(openBrowserArgs).then(data => {
        expect(data).to.equal(undefined);
      });
    });

    it('openBrowser should initiate the CRI client object', () => {
      return openBrowser(openBrowserArgs).then(() => {
        expect(client).not.to.be.null;
      });
    });

    afterEach(async () => await closeBrowser());
  });

  describe('throws an error', () => {
    it('openBrowser should throw an error when options parameter is string', async () =>
      await openBrowser('someString').catch(error => expect(error).to.be.an.instanceOf(Error)));
    it('openBrowser should throw an error when options parameter is array', async () =>
      await openBrowser([]).catch(error => expect(error).to.be.an.instanceOf(Error)));

    it('openBrowser should throw error, when it is called before closeBrowser is called', async () => {
      await openBrowser(openBrowserArgs);
      await openBrowser(openBrowserArgs).catch(error => expect(error).to.be.an.instanceOf(Error));
      await closeBrowser();
    });
  });

  describe('browser crashes', () => {
    let chromeProcess;
    beforeEach(async () => {
      taiko.__set__('connect_to_cri', async () => {
        taiko.__set__({
          dom: true,
          page: true,
        });
      });
      await openBrowser(openBrowserArgs);
      chromeProcess = taiko.__get__('chromeProcess');
    });

    it('should reset client when chrome process crashes', async () => {
      chromeProcess.kill('SIGKILL');
      await new Promise(resolve => {
        setTimeout(resolve, 10);
      });
      expect(client()).to.be.null;
    });

    it('should allow to open a browser after chrome process crashes', async () => {
      chromeProcess.kill('SIGKILL');
      await openBrowser(openBrowserArgs);
      await closeBrowser();
    });
  });
});
