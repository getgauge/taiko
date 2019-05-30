let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
let { openBrowser, goto, checkBox, closeBrowser, evaluate, $, intervalSecs, timeoutSecs, text, click } = require('../../lib/taiko');
const test_name = 'Checkbox';

describe(test_name, () => {
    let filePath;
    beforeAll(async () => {
        let innerHtml = 
                '<form>' +
                    '<input type="checkbox" id="checkboxWithInlineLabel" name="testCheckbox" value="checkboxWithInlineLabel">checkboxWithInlineLabel</input>' +
                    '<label>' +
                        '<input name="testCheckbox" type="checkbox" value="checkboxWithWrappedInLabel" />' +
                        '<span>checkboxWithWrappedInLabel</span>' +
                    '</label>' +
                    '<p>' +
                        '<input id="checkboxWithLabelFor" name="testCheckbox" type="checkbox" value="checkboxWithLabelFor" />' +
                        '<label for="checkboxWithLabelFor">checkboxWithLabelFor</label>' +
                    '</p>' +
                    '<input type="reset" value="Reset">'+
                '</form>'+
                '<div id="panel" style="display:none">show on check</div>' +
                '<script>' +
                'var elem = document.getElementById("checkboxWithInlineLabel");'+
                'elem.addEventListener("click", myFunction);'+
                'function myFunction() {' +
                'document.getElementById("panel").style.display = "block";' +
                '}</script>';
        filePath = createHtml(innerHtml,test_name);
        await openBrowser(openBrowserArgs);
        await goto(filePath);
    }, 30000);

    afterAll(async () => {
        await closeBrowser();
        removeFile(filePath);
    }, 30000);

    describe('with inline text', () => {
        afterEach(async () => {
            await click('Reset');
        });

        test('test exists()', async () => {
            await expect(checkBox('checkboxWithInlineLabel').exists()).resolves.toBeTruthy();
            await expect(checkBox('Something').exists(intervalSecs(0), timeoutSecs(0))).resolves.toBeFalsy();
        });

        test('test check()', async () => {
            await checkBox('checkboxWithInlineLabel').check();
            let value = await evaluate($('input[name=testCheckbox]:checked'), (element) => element.value);
            expect(value.result).toBe('checkboxWithInlineLabel');
        });

        test('test check() triggers events', async() =>{
            await checkBox('checkboxWithInlineLabel').check();
            await expect(text('show on check').exists()).resolves.toBeTruthy();
        });

        test('test uncheck()', async () => {
            await checkBox('checkboxWithInlineLabel').check();
            await checkBox('checkboxWithInlineLabel').uncheck();
            let value = await evaluate($('input[value=checkboxWithInlineLabel]'), (element) => element.checked);
            await expect(value.result).toBeFalsy();
        });

        test('test isChecked()', async () => {
            await checkBox('checkboxWithInlineLabel').check();
            await expect(checkBox('checkboxWithInlineLabel').isChecked()).resolves.toBeTruthy();
        });
    });

    describe('wrapped in label', () => {    
        test('test exists()', async () => {
            await expect(checkBox('checkboxWithWrappedInLabel').exists()).resolves.toBeTruthy();
        });
    });

    describe('using label for', () => {
        test('test exists()', async () => {
            await expect(checkBox('checkboxWithLabelFor').exists()).resolves.toBeTruthy();
        });
    });
});
