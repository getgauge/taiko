const expect = require('chai').expect;
let { openBrowser, goto, closeBrowser, waitFor, intervalSecs } = require('../../lib/taiko');
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

    describe('waitFor test with element and time', () => {
        it('should return empty array if element is not there', async () => {
            const actual = await waitFor('something that is not there', intervalSecs(1));
            expect(actual.length).to.be.eql(0);
        });
        it('should return the element if element is there', async () => {
            const actual = await waitFor('beautiful', 1000);
            expect(actual.length).to.be.greaterThan(0);
        });
    });

    describe('waitFor test with only time', () => {
        it('should just wait for given time period do not return anything', async () => {
            const actual = await waitFor(1000);
            expect(actual).to.be.eql(undefined);
        });
    });

    describe('waitFor test with only element', () => {
        it('should return empty array if the element is not there', async () => {
            const actual = await waitFor('something that is not there');
            expect(actual.length).to.be.eql(0);
        }).timeout(11000);

        it('should return element if the element is there', async () => {
            const actual = await waitFor('beautiful');
            expect(actual.length).to.be.greaterThan(0);
        }).timeout(11000);
    });
});