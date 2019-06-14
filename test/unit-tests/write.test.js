const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
let { openBrowser, goto, textBox, closeBrowser, write, into, setConfig} = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
let test_name = 'write';

describe(test_name, () => {
    let filePath;
    before(async () => {
        let innerHtml = '<div>' +
        '<form name="inputTypeText">' +
            //Read only input with type text
            '<div name="inputTypeTextWithInlineTextReadonly">' +
                '<input type="text" readonly>inputTypeTextWithInlineTextReadonly</input>' +
            '</div>' +
            '<div name="focused input">' +
                '<input type="text" autofocus>focused input</input>' +
            '</div>' +
            '<div name="input-type-text">' +
                '<input type="text">input-type-text</input>' +
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

    it('into focused element', async () => {
        await write('writing to focused input');
        expect(await textBox('focused input').value()).to.equal('writing to focused input');
    });

    it('into input field text', async () => {
        expect(await textBox('input-type-text').value()).to.equal('');
        await write('hello', into(textBox('input-type-text')));
        expect(await textBox('input-type-text').value()).to.equal('hello');
    });

    it('should fail for readonly feild', async () => {
        await expect(write('inputTypeTextWithInlineText', into(textBox('inputTypeTextWithInlineTextReadonly')))).to.eventually.be.rejected;
    });
});

describe('write test on multiple similar elements',()=>{
    let readonlyFilePath;
    before(async () => {
        let innerHtml = '<div>' +
        '<form name="inputTypeText">' +
            //Read only input with type text
            '<div name="inputTypeText">' +
                '<input type="text" readonly>inputTypeText</input>' +
            '</div>' +
            '<div name="inputTypeText">' +
            '<input type="text">inputTypeText</input>' +
            '</div>' +
            '<div name="readonlyInputTypeText">' +
                '<input type="text" readonly>readonlyInputTypeText</input>' +
            '</div>' +
            '<div name="readonlyInputTypeText">' +
                '<input type="text" readonly>readonlyInputTypeText</input>' +
            '</div>' +
        '</form>';
        '</div>';
        readonlyFilePath = createHtml(innerHtml, test_name);
        await openBrowser(openBrowserArgs);
        await setConfig({waitForNavigation:false});
        await goto(readonlyFilePath);
    });

    after(async () => {
        removeFile(readonlyFilePath);
        await setConfig({waitForNavigation:true});
        await closeBrowser();
    });

    it('should write into first writable element', async () => {
        await expect(write('inputTypeTextWithInlineText', into(textBox('inputTypeText')))).not.to.eventually.be.rejected;
    });

    it('should reject if no element is writable', async () => {
        await expect(write('inputTypeTextWithInlineText', into(textBox('readonlyInputTypeText')))).to.eventually.be.rejectedWith('Element focused is not writable');
    });
});
