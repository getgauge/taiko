const expect = require('chai').expect;
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
let { openBrowser, goto, dropDown, closeBrowser } = require('../../lib/taiko');
const test_name = 'DropDown';

describe(test_name, () => {
    let filePath;
    before(async () => {
        let innerHtml = 
                '<form>' +
                    '<label for="select">Cars</label>' +
                    '<select id="select" name="select" value="select"/>' +
                        '<option value="volvo">Volvo</option>' +
                        '<option value="saab">Saab</option>' +
                        '<option value="mercedes">Mercedes</option>' +
                        '<option value="audi">Audi</option>' +
                    '</select>' +
                    '<label>' +
                        '<span>dropDownWithWrappedInLabel</span>' +
                        '<select id="select" name="select" value="select"/>' +
                            '<option value="volvo1">Volvo1</option>' +
                            '<option value="saab1">Saab1</option>' +
                            '<option value="mercedes1">Mercedes1</option>' +
                            '<option value="audi1">Audi1</option>' +
                    '</label>' +
                '</form>';
        filePath = createHtml(innerHtml,test_name);
        await openBrowser(openBrowserArgs);
        await goto(filePath);
    });

    after(async () => {
        await closeBrowser();
        removeFile(filePath);
    });

    describe('using label for', () => {
        it('test dropdown exists()', async () => {
            expect(await dropDown('Cars').exists()).to.be.true;
        });

        it('test select()', async () => {
            await dropDown('Cars').select('Audi');
            await dropDown('Cars').select('mercedes');
            expect(await dropDown('Cars').value()).to.equal('mercedes');
        });
    });

    describe('wrapped in label', () => {    
        it('test exists()', async () => {
            expect(await dropDown('dropDownWithWrappedInLabel').exists()).to.be.true;
            expect(await dropDown('dropDownWithWrappedInLabel').value()).to.not.equal('mercedes');
        });
    });
});