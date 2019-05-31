const expect = require('chai').expect;
let { openBrowser, click, closeBrowser, goto, text, below } = require('../../lib/taiko');
let { createHtml, removeFile, openBrowserArgs } = require('./test-util');
const test_name = 'Click';

describe.only(test_name, () => {
    let filePath;
    before(async () => {
        let innerHtml = `
            <span>Click with proximity</span>
            <div>
                <span onclick="displayText('Click works with text nodes.')">Click on text node</span>
                <span>Click with proximity</span>
            </div>
            <span>Proximity marker</span><br/>
            <span onclick="displayText('Click works with proximity selector.')">Click with proximity</span>
            <input onclick="displayText('Click works with text as value.')" value="Text as value"/>
            <input onclick="displayText('Click works with text as type.')" type="Text as type"/>
            <div onclick="displayText('Click works with text accross element.')">
                Text <span>accross</span> elements
            </div>
            <script type="text/javascript">
                function displayText(text) {
                    document.getElementById('root').innerText = text
                }
            </script>
            <div style="height:1500px"></div>
            <div id="root" style="background:red;"></div>
            <span onclick="displayText('Click works with auto scroll.')">Show Message</span>
            `;
        filePath = createHtml(innerHtml, test_name);
        // await openBrowser({args:openBrowserArgs.args, headless:false/*, observe:true, observeTime:5000*/});
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

    describe('With text nodes', () => {
        it('should click', async () => {
            await click('on text');
            expect(await text('Click works with text nodes.').exists()).to.be.true;
        });
    });

    describe('With proximity selector', () => {
        xit('should click', async () => {
            await click('Click with proximity', below('Proximity marker'));
            expect(await text('Click works with proximity selector.').exists()).to.be.true;
        });
    });

    describe('Text accross element', () => {
        it('should click', async () => {
            await click('Text accross elements');
            expect(await text('Click works with text accross element.').exists()).to.be.true;
        });
    });

    describe('Text as value', () => {
        it('should click', async () => {
            await click('Text as value');
            expect(await text('Click works with text as value.').exists()).to.be.true;
        });
    });

    describe('Text as type', () => {
        it('should click', async () => {
            await click('Text as type');
            expect(await text('Click works with text as type.').exists()).to.be.true;
        });
    });

});