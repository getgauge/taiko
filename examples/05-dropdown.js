const { openBrowser, goto, comboBox, closeBrowser } = require('taiko')
    , expect = require('chai').expect;

(async () => {
    try {
        await openBrowser();
        await goto('http://localhost:3000/dropdown');
        expect(await comboBox().exists()).to.be.true;
        await comboBox().select('Option 1');
        expect(await comboBox().value()).to.eq('1');
    } catch (e) {
        console.error(e);
    } finally {
        await closeBrowser();
    }
})();
