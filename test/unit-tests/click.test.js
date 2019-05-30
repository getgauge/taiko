let { openBrowser, click, closeBrowser, goto, text } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
const test_name = 'Click';

describe(test_name, () => {
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
        filePath = createHtml(innerHtml, test_name);
        await openBrowser(openBrowserArgs);
        await goto(filePath);
    }, 30000);

    afterAll(async () => {
        await closeBrowser();
        removeFile(filePath);
    }, 30000);

    describe('scroll to click', () => {
        test('test if auto scrolls to element before clicking', async () => {
            await click('Show Message');
            await expect(text('Click works with auto scroll.').exists()).resolves.toBeTruthy();
        });
    });
});