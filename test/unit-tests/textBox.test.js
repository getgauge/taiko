let { openBrowser, goto, textBox, closeBrowser, intervalSecs, timeoutSecs } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');

describe('textBox', () => {

    beforeAll(async () => {
        await openBrowser(openBrowserArgs);
    }, 30000);

    afterAll(async () => {
        await closeBrowser();
    }, 30000);

    describe('with inline text', () => {
        let filePath;
        beforeAll(() => {
            let innerHtml = '<form>' +
                '<input type="text" name="color" value="red">Red</input>' +
                '<input type="text" name="color" value="yellow">Yellow</input>' +
                '<input type="text" name="color" value="greeen">Green</input>' +
                '</form>';
            filePath = createHtml(innerHtml);
        });

        beforeEach(async () => {
            await goto(filePath);
        }, 10000);

        afterAll(() => {
            removeFile(filePath);
        });

        test('test exists()', () => {
            expect(textBox('Yellow').exists()).resolves.toBeTruthy();
            expect(textBox('Brown').exists(intervalSecs(0), timeoutSecs(0))).resolves.toBeFalsy();
        });
    });

    describe('wrapped in label', () => {
        let filePath;
        beforeAll(() => {
            let innerHtml = '<form>' +
                '<label>' +
                '<input name="color" type="text" value="red" />' +
                '<span>Red</span>' +
                '</label>' +
                '<label>' +
                '<input name="color" type="text" value="yellow" />' +
                '<span>Yellow</span>' +
                '</label>' +
                '<label>' +
                '<input name="color" type="text" value="green" />' +
                '<span>Green</span>' +
                '</label>' +
                '</form>';
            filePath = createHtml(innerHtml);
        });

        beforeEach(async () => {
            await goto(filePath);
        });

        afterAll(() => {
            removeFile(filePath);
        });

        test('test exists()', async () => {
            await expect(textBox('Green').exists()).resolves.toBeTruthy();
            await expect(textBox('Brown').exists(intervalSecs(0), timeoutSecs(0))).resolves.toBeFalsy();
        });
    });

    describe('using label for', () => {
        let filePath;
        beforeAll(() => {
            let innerHtml = '<form>' +
                '<p>' +
                '<input id="c1" name="color" type="text" value="red" />' +
                '<label for="c1">Red</label>' +
                '</p>' +
                '<p>' +
                '<label for="c2">Yellow</label>' +
                '<input id="c2" name="color" type="text" value="yellow" />' +
                '</p>' +
                '<p>' +
                '<label for="c3"><input id="c3" name="color" type="text" value="green" />Green</label>' +
                '</p>' +
                '</form>';
            filePath = createHtml(innerHtml);
        });

        beforeEach(async () => {
            await goto(filePath);
        });

        afterAll(() => {
            removeFile(filePath);
        });

        test('test exists()', async () => {
            await expect(textBox('Red').exists()).resolves.toBeTruthy();
            await expect(textBox('Yellow').exists()).resolves.toBeTruthy();
            await expect(textBox('Green').exists()).resolves.toBeTruthy();
            await expect(textBox('Brown').exists(intervalSecs(0), timeoutSecs(0))).resolves.toBeFalsy();
        });
    });
});
