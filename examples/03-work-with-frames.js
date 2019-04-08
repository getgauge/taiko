const { openBrowser, goto, text, closeBrowser, loadPlugin } = require('taiko')
    , path = require('path')
    , {ID, clientHandler, startScreencast, stopScreencast} = require('taiko-screencast')
    , expect = require('chai').expect;

loadPlugin(ID, clientHandler);
    
(async () => {
    try {
        await openBrowser();
        await startScreencast(path.join('captures', 'frames', 'frames.gif'))
        await goto('http://localhost:3000/nested_frames');
        expect(await text('MIDDLE').exists(), 'expected "MIDDLE" to exist on page').to.be.true;
        // taiko does not need to be told about frames, it automagically figures it out.

        //TODO: tinyMCE example
    } catch (e) {
        console.error(e);
    } finally {
        await stopScreencast();
        await closeBrowser();
    }
})();