const expect = require('chai').expect;
let {
  openBrowser,
  closeBrowser,
  client,
  switchTo,
  goto,
  text,
  setConfig,
  evaluate,
} = require('../../lib/taiko');
let { openBrowserArgs, createHtml } = require('./test-util');

describe('opens browser successfully', () => {
  xit("openBrowser should return 'Browser Opened' message", async () => {
    expect(process.env.TAIKO_EMULATE_DEVICE).to.be.undefined;
    await openBrowser(openBrowserArgs).then(data => {
      expect(data).to.equal(undefined);
    });
  });

  it('openBrowser should initiate the CRI client object', () => {
    return openBrowser(openBrowserArgs).then(() => {
      expect(client).not.to.be.null;
    });
  });

  afterEach(async () => await closeBrowser());
});

describe('open browser and create browser context', () => {
  it('Should have incognito window', async () => {
    let innerHtml = `<section class="header">
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

    let innerHtml1 = `<section class="header">
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
    let filePath;
    filePath = createHtml(innerHtml, 'Incognito');
    await openBrowser({ profile: 'user' });
    setConfig({
      waitForNavigation: true,
      retryTimeout: 100,
      retryInterval: 10,
    });
    await goto(filePath);

    let actual = await text('Browser1').exists();
    expect(actual).to.be.true;

    await openBrowser({ profile: 'admin' });
    filePath = createHtml(innerHtml1, 'Incognito1');
    await goto(filePath);
    let actualBrowser2 = await text('Browser2').exists();
    expect(actualBrowser2).to.be.true;

    await switchTo({ profile: 'user' });
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
    await closeBrowser({ profile: 'user' });
    await closeBrowser({ profile: 'admin' });
  });
});

describe('Isolation session storage test', () => {
  it('should isolate localStorage and cookies', async () => {
    let innerHtml = `<section class="header">
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

    let innerHtml1 = `<section class="header">
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
    let filePath;
    filePath = createHtml(innerHtml, 'Incognito');
    await openBrowser({ profile: 'user' });
    setConfig({
      waitForNavigation: true,
      retryTimeout: 100,
      retryInterval: 10,
    });
    await goto(filePath);

    await evaluate(() => {
      localStorage.setItem('name', 'page1');
    });

    await openBrowser({ profile: 'admin' });
    filePath = createHtml(innerHtml1, 'Incognito1');
    await goto(filePath);

    await evaluate(() => {
      localStorage.setItem('name', 'page2');
    });

    const adminSessionLocalStorage = await evaluate(() => {
      return localStorage.getItem('name');
    });

    expect(adminSessionLocalStorage).to.equal('page2');

    await switchTo({ profile: 'user' });

    const userSessionLocalStorage = await evaluate(() => {
      return localStorage.getItem('name');
    });

    expect(userSessionLocalStorage).to.equal('page1');
  });
  after(async () => {
    await closeBrowser({ profile: 'user' });
    await closeBrowser({ profile: 'admin' });
  });
});

describe('open browser throws an error', () => {
  it('openBrowser should throw an error when options parameter is string', async () =>
    await openBrowser('someString').catch(error =>
      expect(error).to.be.an.instanceOf(Error),
    ));
  it('openBrowser should throw an error when options parameter is array', async () =>
    await openBrowser([]).catch(error =>
      expect(error).to.be.an.instanceOf(Error),
    ));

  it('openBrowser should throw error, when it is called before closeBrowser is called', async () => {
    await openBrowser();
    await openBrowser().catch(error =>
      expect(error).to.be.an.instanceOf(Error),
    );
    await closeBrowser();
  });
});
