const { openBrowser, goto, comboBox, closeBrowser, loadPlugin } = require('taiko')
    , path = require('path')
    , {ID, clientHandler, startScreencast, stopScreencast} = require('taiko-screencast')
    , expect = require('chai').expect;

loadPlugin(ID, clientHandler);

(async () => {
    try {
        await openBrowser();
        await startScreencast(path.join('captures', 'dropdown', 'dropdown.gif'))
        await goto('http://localhost:3000/dropdown');
        expect(await comboBox().exists()).to.be.true;
        await comboBox().select('Option 1');
        expect(await comboBox().value()).to.eq('1');
    } catch (e) {
        console.error(e);
    } finally {
        await stopScreencast();
        await closeBrowser();
    }
})();
