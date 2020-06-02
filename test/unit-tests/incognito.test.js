const expect = require('chai').expect;
let {
  openBrowser,
  closeBrowser,
  switchTo,
  text,
  goto,
  setConfig,
  evaluate,
  openIncognitoWindow,
  closeIncognitoWindow,
  currentURL,
} = require('../../lib/taiko');
let { openBrowserArgs, resetConfig } = require('./test-util');

let { isIncognito, getBrowserContexts } = require('../../lib/browserContext');

let { createHtml, removeFile } = require('./test-util');

describe.skip('Browser Context', () => {
  let url1, url2;
  before(async () => {
    await openBrowser(openBrowserArgs);
    setConfig({
      waitForNavigation: true,
      retryTimeout: 10,
      retryInterval: 10,
    });
    const innerHtml = `<section class="header">
                    <h1>Incognito tests</h1>
                      </section>
                        <section class='main-content'>
                          <div class='item'>
                            Item 1
                          </div>
                          <div class='item'>
                            Browser1
                      </div>
                    </section>`;

    const innerHtml1 = `<section class="header">
                      <h1>Incognitotests</h1>
                        </section>
                          <section class='main-content'>
                            <div class='item'>
                              Item 2
                            </div>
                            <div class='item'>
                            Browser2
                      </div>
                      </section>`;
    url1 = createHtml(innerHtml, 'Incognito');
    url2 = createHtml(innerHtml1, 'Incognito1');
  });

  after(async () => {
    resetConfig();
    await closeBrowser();
    removeFile(url2);
    removeFile(url1);
  });

  describe('open browser and create browser context', () => {
    it('Should have incognito window', async () => {
      await openIncognitoWindow(url1, { name: 'admin' });
      let actual = await text('Browser1').exists();
      expect(actual).to.be.true;

      await openIncognitoWindow(url2, { name: 'user' });

      let actualBrowser2 = await text('Browser2').exists();
      expect(actualBrowser2).to.be.true;

      await switchTo({ name: 'admin' });
      let backToUser1 = await text('Browser1').exists();
      expect(backToUser1).to.be.true;

      let browser1 = await evaluate(text('Item 1'), (element) => {
        return element.textContent.trim();
      });
      expect(browser1).to.be.equal('Item 1');

      let inactiveUser2 = await text('Browser2').exists();
      expect(inactiveUser2).to.be.false;
    });

    after(async () => {
      await closeIncognitoWindow('admin');
      await closeIncognitoWindow('user');
    });
  });

  describe('open incognito window without url',() => {
    it('should open a blank page when url not given', async () => {
      await openIncognitoWindow({name:'admin'});
      expect(await currentURL()).to.equal('about:blank');
      await closeIncognitoWindow('admin');
    });
  });

  describe('Open window in Incognito Mode', () => {
    it('Open window in incognito', async () => {
      await openIncognitoWindow(url1, { name: 'admin' });
      expect(isIncognito({ name: 'admin' })).to.be.true;
    });
    after(async () => {
      await closeIncognitoWindow('admin');
    });
  });

  describe('Open window in Incognito Mode', () => {
    it('Open window in incognito and use the default window', async () => {
      await openIncognitoWindow(url1, { name: 'admin' });
      expect(isIncognito({ name: 'admin' })).to.be.true;
      await closeIncognitoWindow('admin');
      await goto(url1);
      let backToDefaultBrowser = await text('Browser1').exists();
      expect(backToDefaultBrowser).to.be.true;
    });
  });

  describe('Open window with same window name', () => {
    it('Should switch to existing window', async () => {
      await openIncognitoWindow(url1, { name: 'admin' });
      await openIncognitoWindow(url1, { name: 'admin' });
      expect(getBrowserContexts().size).to.be.equal(1);
    });
    after(async () => {
      await closeIncognitoWindow('admin');
    });
  });

  describe('Isolation session storage test', () => {
    it('should isolate localStorage and cookies', async () => {
      await openIncognitoWindow(url1, { name: 'admin' });
      await evaluate(() => {
        localStorage.setItem('name', 'page1');
      });

      await openIncognitoWindow(url2, { name: 'user' });

      await evaluate(() => {
        localStorage.setItem('name', 'page2');
      });

      const adminSessionLocalStorage = await evaluate(() => {
        return localStorage.getItem('name');
      });

      expect(adminSessionLocalStorage).to.equal('page2');

      await switchTo({ name: 'admin' });

      const userSessionLocalStorage = await evaluate(() => {
        return localStorage.getItem('name');
      });

      expect(userSessionLocalStorage).to.equal('page1');
    });
    after(async () => {
      await closeIncognitoWindow('admin');
      await closeIncognitoWindow('user');
    });
  });

  describe('open window throws an error', () => {
    it('openIncognitoWindow should throw an error when url parameter is missing', async () => {
      await openIncognitoWindow({ name: 'window' }).catch((error) =>
        expect(error).to.be.an.instanceOf(TypeError),
      );
    });

    it('openIncognitoWindow should throw an error when window name parameter is missing', async () => {
      await openIncognitoWindow('localhost:8000').catch((error) =>
        expect(error).to.be.an.instanceOf(TypeError),
      );
    });
  });
});
