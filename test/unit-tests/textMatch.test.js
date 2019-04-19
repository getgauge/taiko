let { openBrowser, goto, closeBrowser, text, inputField, toRightOf } = require('../../lib/taiko');
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
                '</div>';
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
});
