const { goto, below, inputField, write } = require('taiko')
    , {openBrowserAndStartScreencast, closeBrowserAndStopScreencast} = require('./browserLauncher')
    , path = require('path')
    , expect = require('chai').expect;

(async () => {
    try {
        await openBrowserAndStartScreencast(path.join('captures', 'contenteditable', 'contenteditable.gif'))
        // a local file with simple `contenteditable`
        await goto('file:///home/steam/projects/taiko/examples/data/contenteditable.html');
        var text = 'Taiko writes into a contenteditable field!';
        await write(text, into(inputField(below('Editable Demo'))));
        var content = await inputField(below('Editable Demo')).text();
        expect(content[0]).to.have.string(text);

        // a rich text editor
        await goto('http://localhost:3000/tinymce');
        text = 'Taiko writes into a tinyMCE editor';
        await write(text, into(inputField(below('An iFrame'))));
        content = await into(inputField(below('An iFrame'))).text();
        expect(content[0]).to.have.string(text);
    } catch (e) {
        console.error(e);
    } finally {
        await closeBrowserAndStopScreencast();
    }
})();
