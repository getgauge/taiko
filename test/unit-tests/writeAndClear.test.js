let { openBrowser, goto, inputField, closeBrowser, write, clear, into } = require('../../lib/taiko');
let { createHtml, openBrowserArgs, removeFile } = require('./test-util');
const test_name = 'Write and Clear';

describe('Write and Clear', () => {

    beforeAll(async () => {
        await openBrowser(openBrowserArgs);
    }, 30000);

    afterAll(async () => {
        await closeBrowser();
    }, 30000);


    describe('clear input field', () => {
        let filePath;
        beforeAll(() => {

            let innerHtml = '<form> \n' +
                '<p><label for="login">Login<input type="text" name="user[login]" id="user[login]" /></label></p> \n' +
                '<p><label for="email">Email<input type="text" name="user[email]" id="user[email]" /></label></p> \n' +
                '<p><label for="password">Password<input type="text" name="user[password]" id="user[password]" /></label></p> \n' +
                '</form>';
            filePath = createHtml(innerHtml, test_name);
        });

        beforeEach(async () => {
            await goto(filePath);
        });

        afterAll(() => {
            removeFile(filePath);
        });

        test('test write and clear()', async () => {
            await expect(inputField('Email').exists()).resolves.toBeTruthy();
            await write('abc@gmail.com', into(inputField('Email')));
            await clear(inputField('Email'));
            await expect(inputField('Email').value()).resolves.toBe('');
        });
    });
});