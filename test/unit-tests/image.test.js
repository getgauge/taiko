const expect = require('chai').expect;
let { openBrowser, closeBrowser, goto, image, below } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
const test_name = 'image';

describe(test_name, () => {
    let filePath;
    before(async () => {
        let innerHtml = `
        <div class="example">
            <h3>Images</h3>
            <img src="brokenImage.jpg" id="brokenImage">
            <img src="avatar-blank.jpg" alt="avatar">
        </div>
            `;
        filePath = createHtml(innerHtml, test_name);
        await openBrowser(openBrowserArgs);
        await goto(filePath);
    });

    after(async () => {
        await closeBrowser();
        removeFile(filePath);
    });

    describe('image exists in page', () => {
        it('should find the image with text', async () => {
            expect(await image('avatar').exists()).to.be.true;
        });
        it('should find the image with selectors', async () => {
            expect(await image({ id: 'brokenImage' }).exists()).to.be.true;
            expect(await image({ src: 'brokenImage.jpg' }).exists()).to.be.true;
        });
        it('should find the image with proximity selector', async () => {
            expect(await image(below('Images')).exists()).to.be.true;
        });
    });
});