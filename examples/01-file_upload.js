const { openBrowser, goto, fileField, button, above, attach, click, text, closeBrowser } = require('taiko')
    , path = require('path')
    , expect = require('chai').expect;

(async () => {
    try {
        await openBrowser();
        await goto('http://localhost:3000/upload');
        await attach(path.join(__dirname, 'data', 'foo.txt'), fileField(above(button('Upload'))));
        await click('Upload');
        expect(await text('file uploaded!').exists()).to.be.true;
    } catch (e) {
        console.error(e);
    } finally {
        await closeBrowser();
    }
})();
