const chai = require('chai');
const expect = chai.expect;
const rewire = require('rewire');
const taiko = rewire('../../lib/taiko');
let { openBrowser, closeBrowser, client } = taiko;

let { openBrowserArgs } = require('./test-util');
describe('OpenBrowser', () => {
  describe('throws an error', () => {
    it('openBrowser should throw an error when options parameter is string', async () =>
      await openBrowser('someString').catch((error) => expect(error).to.be.an.instanceOf(Error)));
    it('openBrowser should throw an error when options parameter is array', async () =>
      await openBrowser([]).catch((error) => expect(error).to.be.an.instanceOf(Error)));

    it('openBrowser should throw error, when it is called before closeBrowser is called', async () => {
      await openBrowser(openBrowserArgs);
      await openBrowser(openBrowserArgs).catch((error) => expect(error).to.be.an.instanceOf(Error));
      await closeBrowser();
    });
  });

  describe('should set args', async () => {
    it('from env variable TAIKO_BROWSER_ARGS', async () => {
      process.env.TAIKO_BROWSER_ARGS =
        '--test-arg, --test-arg1,--test-arg2=testArg2zValue1,testArg2zValue2, --test-arg3';
      const setBrowserArgs = taiko.__get__('setBrowserArgs');
      const testArgs = await setBrowserArgs({ args: ['something'] });
      const expectedArgs = [
        'something',
        '--test-arg',
        '--test-arg1',
        '--test-arg2=testArg2zValue1,testArg2zValue2',
        '--test-arg3',
      ];
      expect(testArgs).to.include.members(expectedArgs);
    });
  });

  describe('browser crashes', () => {
    let chromeProcess;
    beforeEach(async () => {
      taiko.__set__('connect_to_cri', async () => {
        taiko.__set__({
          dom: true,
          page: { close: () => {} },
          _client: { _ws: { readyState: 1 }, removeAllListeners: () => {}, close: () => {} },
        });
      });
      await openBrowser(openBrowserArgs);
      chromeProcess = taiko.__get__('chromeProcess');
    });

    it('should reset client when chrome process crashes', async () => {
      chromeProcess.kill('SIGKILL');
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
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
