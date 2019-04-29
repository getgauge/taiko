const { openBrowser, goto, below, inputField, closeBrowser } = require('taiko')
    ,expect = require('chai').expect;

(async () => {
    try {
        await openBrowser();
        // a local file with simple `contenteditable`
        await goto('file:///home/steam/projects/taiko/examples/data/contenteditable.html');
        expect(await inputField(below('Editable Demo')).exists()).to.be.true;

        // a rich text editor
        await goto('http://localhost:3000/tinymce');
        expect(await inputField(below('An iFrame')).exists()).to.be.true;
    } catch (e) {
        console.error(e);
    } finally {
        await closeBrowser();
    }
})();
