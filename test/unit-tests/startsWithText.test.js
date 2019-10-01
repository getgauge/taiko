const expect = require('chai').expect;
let {
    openBrowser,
    closeBrowser,
    goto,
    startsWithText,
    click,
    setConfig,
} = require('../../lib/taiko');
let {
    createHtml,
    removeFile,
    openBrowserArgs,
} = require('./test-util');
const test_name = 'startsWithText';

describe(test_name, () => {
    let filePath;
    before(async () => {
        let innerHtml = `
        <p>
            Click <div id="redirect" href="redirect">Taiko With Gauge</div> to trigger a redirect.
        </p>
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

    describe('Text exists in page', () => {
        it('should find the link starts With text', async () => {
            expect(await startsWithText('Taiko With').exists()).to.be.true;
        });
        it('should accept only Text Parameter', async () => {
            expect(await click(startsWithText('Taiko With')));
        });
    });
});
