const { openBrowser, goto, text, closeBrowser } = require('taiko')
    ,expect = require('chai').expect;
(async () => {
    try {
        await openBrowser();
        await goto('http://admin:admin@localhost:3000/basic_auth');
        expect(await text('Congratulations! You must have the proper credentials.').exists()).to.be.true;
    } catch (e) {
        console.error(e);
    } finally {
        await closeBrowser();
    }
})();
