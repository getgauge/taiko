const { openBrowser, goto, text, closeBrowser } = require('taiko')
    , expect = require('chai').expect;

(async () => {
    try {
        await openBrowser();
        await goto('http://localhost:3000/nested_frames');
        expect(await text('MIDDLE').exists(), 'expected "MIDDLE" to exist on page').to.be.true;
        // taiko does not need to be told about frames, it automagically figures it out.

        //TODO: tinyMCE example
    } catch (e) {
        console.error(e);
    } finally {
        await closeBrowser();
    }
})();