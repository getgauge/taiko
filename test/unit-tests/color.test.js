const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let { openBrowser, closeBrowser, goto, color, toLeftOf, setConfig } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs, resetConfig } = require('./test-util');

describe('Color picker test', () => {
  let filePath;

  before(async () => {
    let innerHtml = `
      <div>
          <input type="color" id="head" name="head"
                 value="#e66465">
          <label for="head">Head</label>
      </div>
      
      <div>
          <input type="color" id="body" name="body"
                  value="#f6b73c">
          <label for="body">FirstElement</label>
      </div>

      <div>
          <input type="color" id="body" name="body"
                  value="#f6b73c">
          <label for="body">SecondElement</label>
      </div>`;
    filePath = createHtml(innerHtml, 'Color Picker');
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

  it('Set color picker', async () => {
    await color({ id: 'head' }).select('#4903fc');
    expect(await color({ id: 'head' }).value()).to.be.equal('#4903fc');
  });

  it('Set color picker without hash', async () => {
    await color({ id: 'head' }).select('4903fc');
    expect(await color({ id: 'head' }).value()).to.be.equal('#4903fc');
  });

  it('Set color picker with proximity selectors', async () => {
    await color(toLeftOf('Head')).select('#490333');
    expect(await color(toLeftOf('Head')).value()).to.be.equal('#490333');
  });

  it('Set color picker with rgb()', async () => {
    await color(toLeftOf('Head')).select('rgb(69, 35, 30)');
    expect(await color(toLeftOf('Head')).value()).to.be.equal('#45231e');
  });

  it('Should fail when color picker is set with invalid rgb()', async () => {
    await expect(color(toLeftOf('Head')).select('rgb(69,30)')).to.be.rejectedWith(
      'The color code rgb(69,30) is invalid. Please pass a valid HTML color code.',
    );
  });

  it('Should fail when color picker is set with invalid hex value', async () => {
    await expect(color(toLeftOf('Head')).select('#3233333')).to.be.rejectedWith(
      'The color code #3233333 is invalid. Please pass a valid HTML color code.',
    );
  });
});
