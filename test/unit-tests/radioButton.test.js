let { openBrowser, radioButton, closeBrowser, evaluate, $, intervalSecs, timeoutSecs, goto, text, click } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');

describe('radio button', () => {
    let filePath;
    beforeAll(async () => {
        let innerHtml = 
                '<form>' +
                    '<input type="radio" id="radioButtonWithInlineLabel" name="testRadioButton" value="radioButtonWithInlineLabel">radioButtonWithInlineLabel</input>' +
                    '<label>' +
                        '<input name="testRadioButton" type="radio" value="radioButtonWithWrappedLabel"/>' +
                        '<span>radioButtonWithWrappedLabel</span>' +
                    '</label>' +
                    '<p>' +
                        '<input id="radioButtonWithLabelFor" name="testRadioButton" type="radio" value="radioButtonWithLabelFor"/>' +
                        '<label for="radioButtonWithLabelFor">radioButtonWithLabelFor</label>' +
                    '</p>' +
                    '<input type="reset" value="Reset">'+
                '</form>'+
                '<div id="panel" style="display:none">show on check</div>' +
                '<script>' +
                'var elem = document.getElementById("radioButtonWithInlineLabel");'+
                'elem.addEventListener("click", myFunction);'+
                'function myFunction() {' +
                'document.getElementById("panel").style.display = "block";' +
                '}</script>';
        filePath = createHtml(innerHtml, 'radioButton');
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
            await expect(radioButton('radioButtonWithInlineLabel').exists()).resolves.toBeTruthy();
            await expect(radioButton('Something').exists(intervalSecs(0), timeoutSecs(0))).resolves.toBeFalsy();
        });

        test('test select()', async () => {
            await radioButton('radioButtonWithInlineLabel').select();
            let value = await evaluate($('input[name=testRadioButton]:checked'), (element) => element.value);
            expect(value.result).toBe('radioButtonWithInlineLabel');
        });

        test('test select() triggers events', async() =>{
            await radioButton('radioButtonWithInlineLabel').select();
            await expect(text('show on check').exists()).resolves.toBeTruthy();
        });

        test('test deselect()', async () => {
            await radioButton('radioButtonWithInlineLabel').select();
            await radioButton('radioButtonWithInlineLabel').deselect();
            let value = await evaluate($('input[value=radioButtonWithInlineLabel]'), (element) => element.checked);
            await expect(value.result).toBeFalsy();
        });

        test('test isSelected()', async () => {
            await radioButton('radioButtonWithInlineLabel').select();
            await expect(radioButton('radioButtonWithInlineLabel').isSelected()).resolves.toBeTruthy();
        });
    });

    describe('wrapped in label', () => {
        test('test exists()', async () => {
            await expect(radioButton('radioButtonWithWrappedLabel').exists()).resolves.toBeTruthy();
        });
    });

    describe('using label for', () => {
        test('test exists()', async () => {
            await expect(radioButton('radioButtonWithLabelFor').exists()).resolves.toBeTruthy();
        });
    });
});
