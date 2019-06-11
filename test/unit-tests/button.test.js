const expect = require('chai').expect;
let { openBrowser, goto, closeBrowser, button, setConfig } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
const test_name = 'button';


describe(test_name, () => {
    let filePath;
    before(async () => {
        let innerHtml =
            '<div name="inline button text">' +
            '<button type="button">Click</button>' +
            '<input type="button" value="Input Button" />' +
            '<input type="reset" value="Input Reset" />' +
            '<input type="submit" value="Input Submit" />' +
            '</div>' +
            '<div name="button in label">' +
            '<label><input type="button" value="inputButtonInLabel" /><span>InputButtonInLabel</span></label>' +
            '<label><input type="reset" /><span>ResetInLabel</span></label>' +
            '<label><input type="submit" /><span>SubmitInLabel</span></label>' +
            '</div>' +
            '<div name="button in label for">' +
            '<label for="inputButton" >LabelForButton</label> <input type="button" id="inputButton" />' +
            '<label for="inputReset" >LabelForReset</label> <input type="button" id="inputReset" />' +
            '<label for="inputSubmit" >LabelForSubmit</label> <input type="button" id="inputSubmit" />' +
            '</div>';
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
    describe('button test', () => {
        describe('exists()', () => {
            it('button exists()', async () => {
                expect(await button('Click').exists()).to.be.true;
                expect(await button('Input Button').exists()).to.be.true;
                expect(await button('Input Reset').exists()).to.be.true;
                expect(await button('Input Submit').exists()).to.be.true;
            });
        });
        describe('exists with label', () => {
            it('test exists with label()', async () => {
                expect(await button('InputButtonInLabel').exists()).to.be.true;
                expect(await button('ResetInLabel').exists()).to.be.true;
                expect(await button('SubmitInLabel').exists()).to.be.true;
            });
        });
        describe('exists with label for', () => {
            it('test exists with label for()', async () => {
                expect(await button('LabelForButton').exists()).to.be.true;
                expect(await button('LabelForReset').exists()).to.be.true;
                expect(await button('LabelForSubmit').exists()).to.be.true;
            });
        });
        describe('button with contains match', () => {
            it('should match button with partial text', async () => {
                expect(await button('ForButton').exists()).to.be.true;
                expect(await button('ForReset').exists()).to.be.true;
                expect(await button('ForSubmit').exists()).to.be.true;
            });
        });
    });
});