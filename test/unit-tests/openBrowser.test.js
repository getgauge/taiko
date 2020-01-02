const expect = require('chai').expect;
let {
  openBrowser,
  closeBrowser,
  client,
  closeIncognitoBrowser,
  openIncognitoBrowser,
  switchToIncognitoBrowser,
  evaluate,
  goto,
  text,
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

describe.only('open browser and create browser context', () => {
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
    await openBrowser({ profiles: true, headless: true });
    await openIncognitoBrowser('user-1');
    await goto(filePath);

    let expected = 'Item 1';
    let actual = await evaluate(text('Item 1'), element => {
      return element.textContent.trim();
    });
    console.log(await text('Browser1').exists());
    expect(actual).to.be.equal(expected);

    await openIncognitoBrowser('user-2');
    filePath = createHtml(innerHtml1, 'Incognito1');
    await goto(filePath);
    let expectedBrowser2 = 'Item 2';
    let actualBrowser2 = await evaluate(text('Item 2'), element => {
      return element.textContent.trim();
    });
    expect(actualBrowser2).to.be.equal(expectedBrowser2);

    await switchToIncognitoBrowser('user-1');
    let expectedBrowser1 = 'Browser1';
    console.log(await text('Browser1').exists());
    let actualBrowser1 = await evaluate(text('Browser1'), element => {
      return element.textContent.trim();
    });
    expect(actualBrowser1).to.be.equal(expectedBrowser1);

    await closeIncognitoBrowser('user-1');
    await closeIncognitoBrowser('user-2');
    await closeBrowser();
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
