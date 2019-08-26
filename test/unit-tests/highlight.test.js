const expect = require('chai').expect;
let {
  openBrowser,
  highlight,
  closeBrowser,
  goto,
  evaluate,
  $,
  setConfig,
} = require('../../lib/taiko');
let {
  createHtml,
  removeFile,
  openBrowserArgs,
} = require('./test-util');
const test_name = 'Highlight';

describe(test_name, () => {
  let filePath;
  before(async () => {
    let innerHtml = `
            <div>
                <a href="/">
                    Text node
                </a>
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

  it('should highlight text node', async () => {
    await highlight('Text node');
    let res = await evaluate($('a'), elem => {
      return elem.style.outline;
    });
    expect(res.result).to.equal('red solid 0.5em');
  });
});
