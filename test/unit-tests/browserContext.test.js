const expect = require('chai').expect;
let {
  openBrowser,
  closeBrowser,
  switchTo,
  text,
  setConfig,
  evaluate,
  openWindow,
  closeWindow,
} = require('../../lib/taiko');

let { isIncognito, getBrowserContexts } = require('../../lib/browserContext');

let { createHtml, removeFile } = require('./test-util');

describe('open browser and create browser context', () => {
  let url1;
  let url2;
  let innerHtml;
  let innerHtml1;
  it('Should have incognito window', async () => {
    innerHtml = `<section class="header">
      <h1>Incognito tests</h1>
        </section>
          <section class='main-content'>
            <div class='item'>
               Item 1
            </div>
            <div class='item'>
               Browser1
         </div>
      </section>
`;

    innerHtml1 = `<section class="header">
<h1>Incognitotests</h1>
  </section>
    <section class='main-content'>
      <div class='item'>
         Item 2
      </div>
      <div class='item'>
      Browser2
</div>
</section>
`;
    url1 = createHtml(innerHtml, 'Incognito');
    await openBrowser();
    setConfig({
      waitForNavigation: true,
      retryTimeout: 100,
      retryInterval: 10,
    });
    await openWindow(url1, { name: 'admin' });
    let actual = await text('Browser1').exists();
    expect(actual).to.be.true;

    url2 = createHtml(innerHtml1, 'Incognito1');
    await openWindow(url2, { name: 'user' });

    let actualBrowser2 = await text('Browser2').exists();
    expect(actualBrowser2).to.be.true;

    await switchTo({ name: 'admin' });
    let backToUser1 = await text('Browser1').exists();
    expect(backToUser1).to.be.true;

    let browser1 = await evaluate(text('Item 1'), element => {
      return element.textContent.trim();
    });
    expect(browser1).to.be.equal('Item 1');

    let inactiveUser2 = await text('Browser2').exists();
    expect(inactiveUser2).to.be.false;
  });

  after(async () => {
    await closeWindow('admin');
    await closeWindow('user');
    await closeBrowser();
    removeFile(url2);
    removeFile(url1);
  });
});

describe('Open window in Incognito Mode', () => {
  let innerHtml;
  let url;
  it('Open window without incognito', async () => {
    innerHtml = `<section class="header">
    <h1>Incognitotests</h1>
      </section>
        <section class='main-content'>
          <div class='item'>
             Item 2
          </div>
          <div class='item'>
          Browser2
    </div>
    </section>
    `;
    url = createHtml(innerHtml, 'Incognito');
    await openBrowser();
    setConfig({
      waitForNavigation: true,
      retryTimeout: 100,
      retryInterval: 10,
    });

    await openWindow(url, { name: 'admin' });
    expect(isIncognito({ name: 'admin' })).to.be.true;
  });
  after(async () => {
    await closeWindow('admin');
    await closeBrowser();
    removeFile(url);
  });
});

describe('Open window with same window name', () => {
  let innerHtml;
  let url;
  it('Should switch to existing window', async () => {
    innerHtml = `<section class="header">
    <h1>Incognitotests</h1>
      </section>
        <section class='main-content'>
          <div class='item'>
             Item 2
          </div>
          <div class='item'>
          Browser2
    </div>
    </section>
    `;
    url = createHtml(innerHtml, 'Incognito');
    await openBrowser();
    setConfig({
      waitForNavigation: true,
      retryTimeout: 100,
      retryInterval: 10,
    });

    await openWindow(url, { name: 'admin' });
    await openWindow(url, { name: 'admin' });
    expect(getBrowserContexts().size).to.be.equal(1);
  });
  after(async () => {
    await closeWindow('admin');
    await closeBrowser();
    removeFile(url);
  });
});

describe('Open window in Normal Mode', () => {
  let innerHtml;
  let url;
  it('Open window without incognito', async () => {
    innerHtml = `<section class="header">
    <h1>Incognitotests</h1>
      </section>
        <section class='main-content'>
          <div class='item'>
             Item 2
          </div>
          <div class='item'>
          Browser2
    </div>
    </section>
    `;
    url = createHtml(innerHtml, 'Incognito');
    await openBrowser();
    setConfig({
      waitForNavigation: true,
      retryTimeout: 100,
      retryInterval: 10,
    });

    await openWindow(url, { name: 'admin', incognito: false });
    expect(isIncognito({ name: 'admin' })).to.be.false;
  });
  after(async () => {
    await closeWindow('admin');
    await closeBrowser();
    removeFile(url);
  });
});

describe('Isolation session storage test', () => {
  let url1;
  let url2;
  let innerHtml;
  let innerHtml1;
  it('should isolate localStorage and cookies', async () => {
    innerHtml = `<section class="header">
      <h1>Incognito tests</h1>
        </section>
          <section class='main-content'>
            <div class='item'>
               Item 1
            </div>
            <div class='item'>
               Browser1
         </div>
      </section>
`;

    innerHtml1 = `<section class="header">
<h1>Incognitotests</h1>
  </section>
    <section class='main-content'>
      <div class='item'>
         Item 2
      </div>
      <div class='item'>
      Browser2
</div>
</section>
`;
    url1 = createHtml(innerHtml, 'Incognito');
    await openBrowser();
    setConfig({
      waitForNavigation: true,
      retryTimeout: 100,
      retryInterval: 10,
    });

    await openWindow(url1, { name: 'admin' });
    await evaluate(() => {
      localStorage.setItem('name', 'page1');
    });

    url2 = createHtml(innerHtml1, 'Incognito1');
    await openWindow(url2, { name: 'user' });

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
    await closeWindow('admin');
    await closeWindow('user');
    await closeBrowser();
    removeFile(url2);
    removeFile(url1);
  });
});

describe('open window throws an error', () => {
  it('openWindow should throw an error when url parameter is missing', async () => {
    await openBrowser();
    await openWindow({ name: 'window' }).catch(error =>
      expect(error).to.be.an.instanceOf(TypeError),
    );
  });

  after(async () => {
    await closeBrowser();
  });
});
