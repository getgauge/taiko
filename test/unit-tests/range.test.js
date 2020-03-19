const chai = require('chai');
const expect = chai.expect;
var sinon = require('sinon');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let { openBrowser, closeBrowser, goto, range, setConfig } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs, resetConfig } = require('./test-util');

describe('Color picker test', () => {
  let filePath;

  before(async () => {
    let innerHtml = `
        <div>
            <input type="range" id="range-1" name="range" 
                min="0" max="100" value='2'>
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

  it('Set Range value with Integer', async () => {
    await range({ id: 'range-1' }).select(10);
    expect(await range({ id: 'range-1' }).value()).to.be.equal('10');
  });

  it('Set Range value with Float value', async () => {
    await range({ id: 'range-1' }).select(10.81);
    expect(await range({ id: 'range-1' }).value()).to.be.equal('11');
  });

  it('Should throw error when value is non integer', async () => {
    await expect(range({ id: 'range-1' }).select('10')).to.be.rejectedWith(
      'The range value should be Int or Float. Please pass a valid value.',
    );
  });

  it('Should throw warning when exceeded maximum value', async () => {
    sinon.stub(console, 'warn');
    await range({ id: 'range-1' }).select(110);
    expect(console.warn.calledOnce).to.be.true;
    expect(
      console.warn.calledWith(
        'The value 110 should be between the minimum range 0 or maximum range 100',
      ),
    ).to.be.true;
  });
});
