const chai = require('chai');
const expect = chai.expect;
const util = require('util');
let { openBrowser, closeBrowser, client } = require('../../lib/taiko');

let { openBrowserArgs } = require('./test-util');

describe('CDP domain proxies', () => {
  beforeEach(async () => {
    await openBrowser(openBrowserArgs);
  });
  afterEach(async () => {
    await closeBrowser();
  });

  it('should create prxy for CDP domains', () => {
    let cdpDomains = ['Page', 'Network', 'Runtime', 'Input', 'DOM', 'Overlay', 'Security'];
    let cdpClient = client();
    for (const iterator of cdpDomains) {
      expect(util.types.isProxy(cdpClient[iterator])).to.be.true;
    }
  });
});
