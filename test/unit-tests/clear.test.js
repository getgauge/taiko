const expect = require('chai').expect;
let { openBrowser, goto, textBox, closeBrowser, clear, setConfig } = require('../../lib/taiko');
let { createHtml, openBrowserArgs, removeFile } = require('./test-util');
const test_name = 'Clear';

describe( test_name, () => {
    let filePath;
    before(async () => {
        let innerHtml = '<form> \n' +
                '<p><label for="email">Email<input type="text" name="user[email]" id="user[email]" value="example@test.com"/></label></p> \n' +
                '</form>';
        filePath = createHtml(innerHtml, test_name);
        await openBrowser(openBrowserArgs);
        await goto(filePath);
        await setConfig({waitForNavigation:false});
    });

    after(async () => {
        await setConfig({waitForNavigation:true});
        await closeBrowser();
        removeFile(filePath);
    });


    describe('clear input field', () => {
        it('test write and clear()', async () => {
            expect(await textBox('Email').exists()).to.be.true;
            expect(await textBox('Email').value()).to.equal('example@test.com');
            await clear(textBox('Email'));
            expect(await textBox('Email').value()).to.equal('');
        });
    });
});