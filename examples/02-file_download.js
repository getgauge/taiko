const { openBrowser, goto, client, click, closeBrowser, loadPlugin } = require('taiko')
    , path = require('path')
    , fs = require('fs')
    , {ID, clientHandler, startScreencast, stopScreencast} = require('taiko-screencast')
    , expect = require('chai').expect;

loadPlugin(ID, clientHandler);

(async () => {
    var downloadPath = path.resolve(__dirname, 'data','downloaded');
    var sleep = (ms) => {
        return new Promise(resolve=>{
            setTimeout(resolve,ms);
        });
    };
    try {
        await openBrowser();
        await startScreencast(path.join('captures', 'file-download', 'file-download.gif'))
        await client().send('Page.setDownloadBehavior', {
            behavior: 'allow', downloadPath: downloadPath});
        await goto('http://localhost:3000/download');
        
        // ensure that file_upload.js is run before this, to allow the file to be available for download
        await click('foo.txt');
        sleep(1000);
        expect(path.join(downloadPath, 'foo.txt')).to.exist;
    } catch (e) {
        console.error(e);
    } finally {
        await stopScreencast();
        await closeBrowser();
        fs.unlinkSync(path.join(downloadPath, 'foo.txt'));
    }
})();