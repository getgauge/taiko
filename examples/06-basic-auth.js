const { openBrowser, goto, text, closeBrowser, loadPlugin } = require('taiko')
    , path = require('path')
    , {ID, clientHandler, startScreencast, stopScreencast} = require('taiko-screencast')
    ,expect = require('chai').expect;

loadPlugin(ID, clientHandler);

(async () => {
    try {
        await openBrowser();
        await startScreencast(path.join('captures', 'basic-auth', 'basic-auth.gif'))
        await goto('http://admin:admin@localhost:3000/basic_auth');
        expect(await text('Congratulations! You must have the proper credentials.').exists()).to.be.true;
    } catch (e) {
        console.error(e);
    } finally {
        await stopScreencast();
        await closeBrowser();
    }
})();
