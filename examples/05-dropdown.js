const { goto, comboBox } = require('taiko')
    , path = require('path')
    , {openBrowserAndStartScreencast, closeBrowserAndStopScreencast} = require('./browserLauncher')
    , expect = require('chai').expect;

(async () => {
    try {
        await openBrowserAndStartScreencast(path.join('captures', 'dropdown', 'dropdown.gif'))
        await goto('http://localhost:3000/dropdown');
        expect(await comboBox().exists()).to.be.true;
        await comboBox().select('Option 1');
        expect(await comboBox().value()).to.eq('1');
    } catch (e) {
        console.error(e);
    } finally {
        await closeBrowserAndStopScreencast();
    }
})();
