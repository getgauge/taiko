let { openBrowser, goto, closeBrowser, text, inputField, toRightOf, evaluate } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');

describe('text match', () => {

    let filePath;
    beforeAll(async () => {
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
    }, 30000);

    afterAll(async () => {
        await closeBrowser();
        removeFile(filePath);
    }, 30000);
        
    describe('text node', () => {
        test('test exact match exists()', async () => {
            await expect(text('User name:').exists()).resolves.toBeTruthy();
            await expect(text('user name:').exists()).resolves.toBeTruthy();
        });

        test('test partial match exists()', async () => {
            await expect(text('User').exists()).resolves.toBeTruthy();
        });

        test('test proximity selector', async () => {
            await expect(inputField(toRightOf('User name:')).exists()).resolves.toBeTruthy();
        });
    });

    describe('value or type of field as text', () => {
        test('test value as text exists()', async () => {
            await expect(text('click me').exists()).resolves.toBeTruthy();
        });

        test('test type as text exists()', async() =>{
            await expect(text('submit').exists()).resolves.toBeTruthy();
        });
    });

    describe('text across element', () => {
        test('test exact match exists()', async () => {
            await expect(text('Text Across Element').exists()).resolves.toBeTruthy();
        });

        test('test partial match exists()', async () => {
            await expect(text('Text').exists()).resolves.toBeTruthy();
        });
    });

    describe('text in iframe should be matched if match in top is invisible', () => {
        test('test text exists()', async () => {
            await expect(text('Text in iframe').exists()).resolves.toBeTruthy();
        });

        test('test text is from iframe', async () => {
            const id = await evaluate(text('Text in iframe'), (elem) => {return elem.parentElement.id;}); 
            expect(id.result).toBe('inIframe');
        });
    });
});
