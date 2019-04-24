let { openBrowser, goto, textBox, closeBrowser, intervalSecs, timeoutSecs } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');

describe('textBox', () => {
    describe('with inline text', () => {
        let filePath;
        beforeAll(() => {
            let innerHtml = '<form>' +
                '<input type="text" name="color" value="red">Red</input>' +
                '<input type="text" name="color" value="yellow">Yellow</input>' +
                '<input type="text" name="color" value="greeen">Green</input>' +
                '</form>';
            filePath = createHtml(innerHtml);
        });

        beforeEach(async () => {
            await openBrowser(openBrowserArgs);
            await goto(filePath);
        }, 10000);

        afterAll(() => {
            removeFile(filePath);
        });

        afterEach(async() => await closeBrowser());

        test('test exists()', () => {
            expect(textBox('Yellow').exists()).resolves.toBeTruthy();
            expect(textBox('Brown').exists(intervalSecs(0), timeoutSecs(0))).resolves.toBeFalsy();
        });
    });
});
