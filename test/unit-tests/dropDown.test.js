const expect = require('chai').expect;
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
let { openBrowser, goto, below, dropDown, closeBrowser, setConfig } = require('../../lib/taiko');
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
                    '<div name="ReasonText"> Reason: </div>' +
                        '<select class="select" name="reasonselection">'+
                            '<option value="-99"> Select </option>' +
                            '<option value="9092">Reason1</option>' +
                            '<option value="9093">Reason2</option>' +
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
        await setConfig({waitForNavigation:false});
    });

    after(async () => {
        await setConfig({waitForNavigation:true});
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

    describe('Select using value', () => {
        it('test select() using value', async () => {
            await dropDown(below('Reason')).select({value:'9092'});
            expect(await dropDown(below('Reason')).value()).to.equal('9092');
        });
    });

    describe('Select using index', () => {
        it('test select() using index', async () => {
            await dropDown(below('Reason')).select({index:1});
            expect(await dropDown(below('Reason')).value()).to.equal('9092');
        });
    });
    
    describe('wrapped in label', () => {    
        it('test exists()', async () => {
            expect(await dropDown('dropDownWithWrappedInLabel').exists()).to.be.true;
            expect(await dropDown('dropDownWithWrappedInLabel').value()).to.not.equal('mercedes');
        });
    });
});