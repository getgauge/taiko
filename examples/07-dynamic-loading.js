const { openBrowser, goto, click, text, closeBrowser } = require('taiko')
    ,expect = require('chai').expect;
(async () => {
    try {
        // example 1
        await openBrowser();
        await goto('http://localhost:3000/dynamic_loading');
        await click('Example 1:');
        await click('Start');
        // no waits, taiko implicitly listens and waits for the right state.
        expect(await text('Hello World').exists()).to.be.true;

        // example 2
        await goto('http://localhost:3000/dynamic_loading');
        await click('Example 2:');
        await click('Start');
        expect(await text('Hello World').exists()).to.be.true;
    } catch (e) {
        console.error(e);
    } finally {
        await closeBrowser();
    }
})();
