const chai = require('chai');
const expect = chai.expect;
var sinon = require('sinon');
const { descEvent } = require('../../lib/eventBus');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let { openBrowser, closeBrowser, goto, range, setConfig, below } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs, resetConfig } = require('./test-util');

describe('Color picker test', () => {
  let filePath;

  before(async () => {
    let innerHtml = `
        <div>
            <p>RangeItem</p>
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
      retryTimeout: 10,
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

  it('Set Range value with Float value as String', async () => {
    await range({ id: 'range-1' }).select('10.81');
    expect(await range({ id: 'range-1' }).value()).to.be.equal('11');
  });

  it('Set Range value with value as String', async () => {
    await range({ id: 'range-1' }).select('10');
    expect(await range({ id: 'range-1' }).value()).to.be.equal('10');
  });

  it('Set Range value with proximity selector', async () => {
    await range({ id: 'range-1' }, below('RangeItem')).select('10');
    expect(await range({ id: 'range-1' }).value()).to.be.equal('10');
  });

  it('Should throw error when value is non integer', async () => {
    await expect(range({ id: 'range-1' }).select('foo')).to.be.rejectedWith(
      "The value foo is not between the input's range of 0-100",
    );
  });

  it('Should throw warning when exceeded maximum value', async () => {
    sinon.stub(console, 'warn');
    await range({ id: 'range-1' }).select(110);
    expect(console.warn.calledOnce).to.be.true;
    expect(console.warn.calledWith("The value 110 is not between the input's range of 0-100")).to.be
      .true;
  });

  it('Test Description emit', async () => {
    descEvent.once('success', (value) => {
      expect(value).to.be.equal('Selected value 100 for the given input value 1111');
    });
    await range({ id: 'range-1' }).select('1111');
  });
});

describe('Color picker test without min and max', () => {
  let filePath;

  before(async () => {
    let innerHtml = `
        <div>
            <p>RangeItem</p>
            <input type="range" id="range-1" name="range" value='2'>
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

  it('Set Range value above the extreme edges', async () => {
    await range({ id: 'range-1' }).select(110);
    expect(await range({ id: 'range-1' }).value()).to.be.equal('100');
  });

  it('Set Range value below the extreme edges', async () => {
    await range({ id: 'range-1' }).select(-1);
    expect(await range({ id: 'range-1' }).value()).to.be.equal('0');
  });
});
