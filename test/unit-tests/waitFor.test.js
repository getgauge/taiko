const expect = require('chai').expect;
let { openBrowser, goto, closeBrowser, waitFor, intervalSecs, text } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
const test_name = 'waitFor';


describe(test_name, () => {
    let filePath;
    before(async () => {
        let innerHtml =
            '<div name="test for wait">' +
            'Patience is the key, because when the right time comes, it will be very beautiful and totally worth the wait.' +
            '</div>';
        filePath = createHtml(innerHtml, test_name);
        await openBrowser(openBrowserArgs);
        await goto(filePath);
    });

    after(async () => {
        await closeBrowser();
        removeFile(filePath);
    });
    describe('waitFor test with only time', () => {
        it('should wait just for given time', async () => {
            await waitFor(3000);
            expect(await text('beautiful').exists()).to.be.true;
        }).timeout(4000);
    });

    describe('waitFor test with only element', () => {
        it('should wait for element for default timeout', async () => {
            await waitFor('beautiful');
            expect(await text('beautiful').exists()).to.be.true;
        });

        xit('should timeout if element is not there', async () => {
            const expectedMessage = new RegExp('waiting failed: retryTimeout 10000ms exceeded');
            expect(await waitFor('something that is not there')).to.throw(expectedMessage);
        }).timeout(12000);

    });

    describe('waitFor test with element and time', () => {
        it('should wait for element with given time ', async () => {
            await waitFor('beautiful', 1000);
            expect(await text('beautiful').exists()).to.be.true;
        });

        it('should return the element if element is there', async () => {
            await waitFor('beautiful', 3000);
            expect(await text('beautiful').exists()).to.be.true;
        }).timeout(5000);

        xit('should wait for element for the given time', async () => {
            const expectedMessage = new RegExp('waiting failed: retryTimeout 5000ms exceeded');
            expect(await waitFor('something that is not there', intervalSecs(5))).to.throw(expectedMessage);
        });
    });
});