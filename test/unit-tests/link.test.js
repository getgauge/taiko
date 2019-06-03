const expect = require('chai').expect;
let { openBrowser, closeBrowser, goto, link,toRightOf } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
const test_name = 'link';

describe(test_name, () => {
    let filePath;
    before(async () => {
        let innerHtml = `
        <p>
            Click <a id="redirect" href="redirect">here</a> to trigger a redirect.
        </p>
            `;
        filePath = createHtml(innerHtml, test_name);
        await openBrowser(openBrowserArgs);
        await goto(filePath);
    });

    after(async () => {
        await closeBrowser();
        removeFile(filePath);
    });

    describe('link exists in page', () => {
        it('should find the link with text', async () => {
            expect(await link('here').exists()).to.be.true;
        });
        it('should find the link with id', async () => {
            expect(await link({id: 'redirect'}).exists()).to.be.true;
        });
        it('should find the link with proximity selector', async () => {
            expect(await link(toRightOf('Click')).exists()).to.be.true;
        });
    });
});