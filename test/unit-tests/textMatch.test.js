const expect = require('chai').expect;
let { openBrowser, goto, closeBrowser, text, textBox, toRightOf, evaluate } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');

describe('text match', () => {

    let filePath;
    before(async () => {
        let innerHtml = '<div>' +
                '<div name="text_node">' +
                'User name: <input type="text" name="uname">' +
                '</div>' +
                '<div name="value_or_type_of_field_as_text">' +
                '<input type="button" value="click me">' +
                '<input type="submit">' +
                '</div>' +
                '<div name="text_across_element">' +
                '<div>Text <span>Across</span> Element</div>' +
                '</div>' +
                '<div id="inTop" name="text_same_as_iframe" style="display: none">' +
                'Text in iframe' +
                '</div>' +
                '<iframe></iframe>' +
                '<script>' +
                'document.querySelector("iframe").contentDocument.write("<div id=\\"inIframe\\">Text in iframe</div>")' +
                '</script>';
        filePath = createHtml(innerHtml, 'textMatch');
        await openBrowser(openBrowserArgs);
        await goto(filePath);
    });

    after(async () => {
        await closeBrowser();
        removeFile(filePath);
    });
        
    describe('text node', () => {
        it('test exact match exists()', async () => {
            expect(await text('User name:').exists()).to.be.true;
            expect(await text('user name:').exists()).to.be.true;
        });

        it('test partial match exists()', async () => {
            expect(await text('User').exists()).to.be.true;
        });

        it('test proximity selector', async () => {
            expect(await textBox(toRightOf('User name:')).exists()).to.be.true;
        });
    });

    describe('value or type of field as text', () => {
        it('test value as text exists()', async () => {
            expect(await text('click me').exists()).to.be.true;
        });

        it('test type as text exists()', async() =>{
            expect(await text('submit').exists()).to.be.true;
        });
    });

    describe('text across element', () => {
        it('test exact match exists()', async () => {
            expect(await text('Text Across Element').exists()).to.be.true;
        });

        it('test partial match exists()', async () => {
            expect(await text('Text').exists()).to.be.true;
        });
    });

    describe('text in iframe should be matched if match in top is invisible', () => {
        it('test text exists()', async () => {
            expect(await text('Text in iframe').exists()).to.be.true;
        });

        it('test text is from iframe', async () => {
            const id = await evaluate(text('Text in iframe'), (elem) => {return elem.parentElement.id;}); 
            expect(id.result).to.equal('inIframe');
        });
    });
});
