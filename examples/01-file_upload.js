const { openBrowser, goto, fileField, button, above, attach, click, text, closeBrowser, loadPlugin} = require('taiko')
    , path = require('path')
    , {ID, clientHandler, startScreencast, stopScreencast} = require('taiko-screencast')
    , expect = require('chai').expect;

loadPlugin(ID, clientHandler);

(async () => {
    try {
        await openBrowser();
        await startScreencast(path.join('captures', 'file-upload', 'file-upload.gif'))
        await goto('http://localhost:3000/upload');
        await attach(path.join(__dirname, 'data', 'foo.txt'), fileField(above(button('Upload'))));
        await click('Upload');
        var exists = await text('file uploaded!').exists();
        expect(exists).to.be.true;
} catch (e) {
        console.error(e);
    } finally {
        await stopScreencast();
        await closeBrowser();
    }
})();
