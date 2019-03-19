const { openBrowser, goto, click, title, closeTab, currentURL, text, closeBrowser } = require('taiko')
    , expect = require('chai').expect;

(async () => {
    try {
        const url = 'http://localhost:3000/windows';
        await openBrowser();
        await goto(url);
        await click('click here');
        expect(await title()).to.eq('New Window');
        await closeTab();
        expect(await currentURL()).to.eq(url);
        expect(await text('Opening a new Window').exists()).to.be.true;
    } catch (e) {
        console.error(e);
    } finally {
        await closeBrowser();
    }
})();