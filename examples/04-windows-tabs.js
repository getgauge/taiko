const { openBrowser, goto, click, title, closeTab, currentURL, text, closeBrowser, loadPlugin } = require('taiko')
    , path = require('path')
    , {ID, clientHandler, startScreencast, stopScreencast} = require('taiko-screencast')
    , expect = require('chai').expect;

loadPlugin(ID, clientHandler);

(async () => {
    try {
        const url = 'http://localhost:3000/windows';
        await openBrowser({args: ['--no-first-run']});
        await startScreencast(path.join('captures', 'windows', 'windows.gif'))
        await goto(url);
        await click('click here');
        expect(await title()).to.eq('New Window');
        await closeTab();
        expect(await currentURL()).to.eq(url);
        expect(await text('Opening a new Window').exists()).to.be.true;
    } catch (e) {
        console.error(e);
    } finally {
        await stopScreencast();
        await closeBrowser();
    }
})();