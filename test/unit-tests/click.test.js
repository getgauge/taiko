const expect = require('chai').expect;
let { openBrowser, click, closeBrowser, goto, text } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
const test_name = 'Click';

describe(test_name, () => {
    let filePath;
    before(async () => {
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
    });

    after(async () => {
        await closeBrowser();
        removeFile(filePath);
    });

    describe('scroll to click', () => {
        it('test if auto scrolls to element before clicking', async () => {
            await click('Show Message');
            expect(await text('Click works with auto scroll.').exists()).to.be.true;
        });
    });
});