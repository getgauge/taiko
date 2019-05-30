const expect = require('chai').expect;
let { openBrowser, goto, textBox, closeBrowser, write, clear, into } = require('../../lib/taiko');
let { createHtml, openBrowserArgs, removeFile } = require('./test-util');
const test_name = 'WriteAndClear';

describe( test_name, () => {
    let filePath;
    before(async () => {
        let innerHtml = '<form> \n' +
                '<p><label for="login">Login<input type="text" name="user[login]" id="user[login]" /></label></p> \n' +
                '<p><label for="email">Email<input type="text" name="user[email]" id="user[email]" /></label></p> \n' +
                '<p><label for="password">Password<input type="text" name="user[password]" id="user[password]" /></label></p> \n' +
                '</form>';
        filePath = createHtml(innerHtml, test_name);
        await openBrowser(openBrowserArgs);
        await goto(filePath);
    });

    after(async () => {
        await closeBrowser();
        removeFile(filePath);
    });


    describe('clear input field', () => {
        it('test write and clear()', async () => {
            expect(await textBox('Email').exists()).to.be.true;
            await write('abc@gmail.com', into(textBox('Email')));
            await clear(textBox('Email'));
            expect(await textBox('Email').value()).to.equal('');
        });
    });
});