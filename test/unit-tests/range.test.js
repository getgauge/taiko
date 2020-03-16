const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let { openBrowser, closeBrowser, goto, range, setConfig } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs, resetConfig } = require('./test-util');

describe.only('Color picker test', () => {
  let filePath;

  before(async () => {
    let innerHtml = `
        <div>
            <input type="range" id="range-1" name="range" 
                min="0" max="100" value='2' step="10">
            <label for="volume">Volume</label>
        </div>
     `;
    filePath = createHtml(innerHtml, 'Range');
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

  it('Set Range value', async () => {
    await range({ id: 'range-1' }).select(10);
    expect(await range({ id: 'range-1' }).value()).to.be.equal('10');
  });
});
