const { openBrowser, closeBrowser, loadPlugin } = require('taiko')
    , {ID, clientHandler, startScreencast, stopScreencast} = require('taiko-screencast')

const screenCastEnabled = process.env.SCREENCAST_ENABLED.toLowerCase() === 'true';

if (screenCastEnabled) {
    loadPlugin(ID, clientHandler);
}

module.exports.openBrowserAndStartScreencast = async (outFile) => {
    await openBrowser({args: ['--no-first-run', '--no-sandbox']});
    if (screenCastEnabled) await startScreencast(outFile);
};

module.exports.closeBrowserAndStopScreencast = async () => {
    if (screenCastEnabled) await stopScreencast();
    await closeBrowser();
}