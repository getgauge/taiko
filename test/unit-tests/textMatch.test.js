let { openBrowser, goto, closeBrowser, text, inputField, toRightOf } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');

describe('text match', () => {
    describe('text node', () => {
        let filePath;
        beforeAll(async () => {
            let innerHtml = '<div>' +
                'User name: <input type="text" name="uname">' +
                '</div>';
            filePath = createHtml(innerHtml, 'text');
            await openBrowser(openBrowserArgs);
            await goto(filePath);
        }, 30000);

        afterAll(async () => {
            await closeBrowser();
            removeFile(filePath);
        }, 30000);

        test('test exact match exists()', async () => {
            await expect(text('User name:').exists()).resolves.toBeTruthy();
            await expect(text('user name:').exists()).resolves.toBeTruthy();
        });

        test('test partial match exists()', async () => {
            await expect(text('User').exists()).resolves.toBeTruthy();
        });

        test('test proximity selector', async () => {
            await expect(inputField(toRightOf('User name:')).exists()).resolves.toBeTruthy();
        });
    });
});
