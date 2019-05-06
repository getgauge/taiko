let { openBrowser, click, closeBrowser, goto, text } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');

describe('radio button', () => {
    beforeAll(async () => {
        await openBrowser(openBrowserArgs);
    }, 30000);

    afterAll(async () => {
        await closeBrowser();
    }, 30000);

    describe('with inline text', () => {
        let filePath;
        beforeAll(async () => {
            let innerHtml = `
            <script type="text/javascript">
                function displayText() {
                    document.getElementById('root').innerText = "Click works with auto scroll."
                }
            </script>
            <div style="height:1500px"></div>
            <div id="root" style="background:red;"></div>
            <span onclick="displayText()">Show Message</span>
            `;
            filePath = createHtml(innerHtml, 'click');
        });

        afterAll(async () => {
            removeFile(filePath);
        });

        beforeEach(async () =>{
            await goto(filePath);
        });

        test('test exists()', async () => {
            await click('Show Message');
            await expect(text('Click works with auto scroll.').exists()).resolves.toBeTruthy();
        });
    });
});