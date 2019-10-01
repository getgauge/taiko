const expect = require('chai').expect;
let {
    openBrowser,
    closeBrowser,
    goto,
    containsText,
    click,
    setConfig,
} = require('../../lib/taiko');
let {
    createHtml,
    removeFile,
    openBrowserArgs,
} = require('./test-util');
const test_name = 'ContainsText';

describe(test_name, () => {
    let filePath;
    before(async () => {
        let innerHtml = `
        <p>
            Click <a id="redirect" href="redirect">Taiko With Gauge</a> to trigger a redirect.
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

    describe('link exists in page', () => {
        it('should find the link which contains text', async () => {
            expect(await containsText('With').exists()).to.be.true;
        });
        it('should accept only Text Parameter', async () => {
            expect(await click(containsText('Gauge')));
        });
    });
});
