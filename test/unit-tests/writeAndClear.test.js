let { openBrowser, goto, inputField, closeBrowser, write, clear, into } = require('../../lib/taiko');
let { createHtml, openBrowserArgs, removeFile } = require('./test-util');
const test_name = 'WriteAndClear';

describe( test_name, () => {
    let filePath;
    beforeAll(async () => {
        let innerHtml = '<form> \n' +
                '<p><label for="login">Login<input type="text" name="user[login]" id="user[login]" /></label></p> \n' +
                '<p><label for="email">Email<input type="text" name="user[email]" id="user[email]" /></label></p> \n' +
                '<p><label for="password">Password<input type="text" name="user[password]" id="user[password]" /></label></p> \n' +
                '</form>';
        filePath = createHtml(innerHtml, test_name);
        await openBrowser(openBrowserArgs);
        await goto(filePath);
    }, 30000);

    afterAll(async () => {
        await closeBrowser();
        removeFile(filePath);
    }, 30000);


    describe('clear input field', () => {
        test('test write and clear()', async () => {
            await expect(inputField('Email').exists()).resolves.toBeTruthy();
            await write('abc@gmail.com', into(inputField('Email')));
            await clear(inputField('Email'));
            await expect(inputField('Email').value()).resolves.toBe('');
        });
    });
});