const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
let { openBrowser, goto, textBox, closeBrowser, write, into, setConfig} = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
let test_name = 'write';

describe('write into readonly text feild', () => {
    let filePath;
    before(async () => {
        let innerHtml = '<div>' +
        //Read only input with type text
        '<form name="inputTypeText">' +
            '<div name="inputTypeTextWithInlineTextReadonly">' +
                '<input type="text" readonly>inputTypeTextWithInlineTextReadonly</input>' +
            '</div>' +
        '</form>';
        '</div>';
        filePath = createHtml(innerHtml, test_name);
        await openBrowser(openBrowserArgs);
        await setConfig({waitForNavigation:false});
        await goto(filePath);
    });

    after(async () => {
        removeFile(filePath);
        await setConfig({waitForNavigation:true});
        await closeBrowser();
    });

    it('write to readonly feild', async () => {
        await expect(write('inputTypeTextWithInlineText', into(textBox('inputTypeTextWithInlineTextReadonly')))).to.eventually.be.rejected;
    });

});
