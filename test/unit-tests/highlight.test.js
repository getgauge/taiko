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
let { createHtml, removeFile, openBrowserArgs, resetConfig } = require('./test-util');
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

  it('should highlight text node', async () => {
    await highlight('Text node');
    let res = await evaluate($('a'), elem => {
      return elem.style.outline;
    });
    expect(res).to.equal('red solid 0.5em');
  });
});
