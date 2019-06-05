const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
let { openBrowser, goto, closeBrowser, waitFor, intervalSecs } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
const test_name = 'waitFor';

chai.use(chaiAsPromised);

describe(test_name, function() {
    this.timeout(12000);
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

    describe('waitFor test without time', () => {
        it('should not wait if time is not given', async () => {
            expect(waitFor()).not.to.eventually.be.rejected;
        });
    });

    describe('waitFor test with only time', () => {
        it('should wait just for given time', async () => {
            expect(waitFor(intervalSecs(3))).not.to.eventually.be.rejected;
        });
    });

    describe('waitFor test with only element', () => {
        it('should wait for element for default timeout', async () => {
            expect(waitFor('beautiful')).not.to.eventually.be.rejected;
        });

        it('should timeout if element is not there', async () => {
            const expectedMessage = new RegExp('Waiting Failed: Element \'something that is not there\' not found within 10000 ms');
            expect(waitFor('something that is not there')).to.eventually.be.rejectedWith(expectedMessage);
        });

    });

    describe('waitFor test with element and time', () => {
        it('should wait for element with given time ', async () => {
            expect(waitFor('Patience', intervalSecs(4))).not.to.eventually.be.rejected;
        });

        it('should wait for element for the given time', async () => {
            const expectedMessage = new RegExp('Waiting Failed: Element \'something that is not there\' not found within 3000 ms');
            expect(waitFor('something that is not there', intervalSecs(3))).to.eventually.be.rejectedWith(expectedMessage);
        });
    });
});