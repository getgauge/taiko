const expect = require('chai').expect;
let { openBrowser, closeBrowser, goto, $, text, above, setConfig } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
const test_name = '$';

describe(test_name, () => {
    let filePath;
    before(async () => {
        let innerHtml = `
        <div class="test">
            <p id="foo">taiko</p>
            <p>demo</p>
        </div>
            `;
        filePath = createHtml(innerHtml, test_name);
        await openBrowser(openBrowserArgs);
        await goto(filePath);
        await setConfig({waitForNavigation:false});
    });

    after(async () => {
        await setConfig({waitForNavigation:true});
        await closeBrowser();
        removeFile(filePath);
    });

    describe('text with xpath', () => {
        it('should find text with xpath', async () => {
            expect(await $('//*[text()=\'taiko\']').exists()).to.be.true;
        });
        it('should find text with selectors', async () => {
            expect(await $('#foo').exists()).to.be.true;
            expect(await $('.test').exists()).to.be.true;
        });
        it('should find text with proximity selector', async () => {
            expect(await text('taiko', above($('//*[text()=\'demo\']'))).exists()).to.be.true;
        });
    });
});