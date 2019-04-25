let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
let { openBrowser, goto, checkBox, closeBrowser, evaluate, $, intervalSecs, timeoutSecs } = require('../../lib/taiko');
const test_name = 'Checkbox';

describe(test_name, () => {
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
                '<input type="checkbox" name="color" value="red">Red</input>' +
                '<input type="checkbox" name="color" value="yellow">Yellow</input>' +
                '<input type="checkbox" name="color" value="green">Green</input>' +
                '</form>';
            filePath = createHtml(innerHtml,test_name);
        });

        beforeEach(async () => {
            await goto(filePath);
        });

        afterAll(() => {
            removeFile(filePath);
        });

        test('test exists()', async () => {
            await expect(checkBox('Yellow').exists()).resolves.toBeTruthy();
            await expect(checkBox('Brown').exists(intervalSecs(0), timeoutSecs(0))).resolves.toBeFalsy();
        });

        test('test check()', async () => {
            await checkBox('Green').check();
            let value = await evaluate($('input[name=color]:checked'), (element) => element.value);
            expect(value.result).toBe('green');
        });

        test('test uncheck()', async () => {
            await checkBox('Red').check();
            await checkBox('Red').uncheck();
            let value = await evaluate($('input[value=red]'), (element) => element.checked);
            await expect(value.result).toBeFalsy();
        });

        test('test isChecked()', async () => {
            await checkBox('Red').check();
            await expect(checkBox('Red').isChecked()).resolves.toBeTruthy();
        });
    });

    describe('wrapped in label', () => {
        let filePath;
        beforeAll(() => {
            let innerHtml = '<form>' +
                '<label>' +
                '<input name="color" type="checkbox" value="red" />' +
                '<span>Red</span>' +
                '</label>' +
                '<label>' +
                '<input name="color" type="checkbox" value="yellow" />' +
                '<span>Yellow</span>' +
                '</label>' +
                '<label>' +
                '<input name="color" type="checkbox" value="green" />' +
                '<span>Green</span>' +
                '</label>' +
                '</form>';
            filePath = createHtml(innerHtml,test_name);
        });

        beforeEach(async () => {
            await goto(filePath);
        });

        afterAll(() => {
            removeFile(filePath);
        });

        test('test exists()', async () => {
            await expect(checkBox('Green').exists()).resolves.toBeTruthy();
            await expect(checkBox('Brown').exists(intervalSecs(0), timeoutSecs(0))).resolves.toBeFalsy();
        });
    });

    describe('using label for', () => {
        let filePath;
        beforeAll(() => {
            let innerHtml = '<form>' +
                '<p>' +
                '<input id="c1" name="color" type="checkbox" value="red" />' +
                '<label for="c1">Red</label>' +
                '</p>' +
                '<p>' +
                '<label for="c2">Yellow</label>' +
                '<input id="c2" name="color" type="checkbox" value="yellow" />' +
                '</p>' +
                '<p>' +
                '<label for="c3"><input id="c3" name="color" type="checkbox" value="green" />Green</label>' +
                '</p>' +
                '</form>';
            filePath = createHtml(innerHtml,test_name);
        });

        beforeEach(async () => {
            await goto(filePath);
        });

        afterAll(() => {
            removeFile(filePath);
        });

        test('test exists()', async () => {
            await expect(checkBox('Red').exists()).resolves.toBeTruthy();
            await expect(checkBox('Yellow').exists()).resolves.toBeTruthy();
            await expect(checkBox('Green').exists()).resolves.toBeTruthy();
            await expect(checkBox('Brown').exists(intervalSecs(0), timeoutSecs(0))).resolves.toBeFalsy();
        });
    });
});
