const { openBrowser, goto, client, click, closeBrowser } = require('taiko')
    , path = require('path')
    , fs = require('fs')
    , expect = require('chai').expect;
(async () => {
    var downloadPath = path.resolve(__dirname, 'data','downloaded');
    var sleep = (ms) => {
        return new Promise(resolve=>{
            setTimeout(resolve,ms);
        });
    };
    try {
        await openBrowser();
        await client().send('Page.setDownloadBehavior', {
            behavior: 'allow', downloadPath: downloadPath});
        await goto('http://the-internet.herokuapp.com/download');
        
        // ensure that file_upload.js is run before this, to allow the file to be available for download
        await click('foo.txt');
        sleep(1000);
        expect(path.join(downloadPath, 'foo.txt')).to.exist;
    } catch (e) {
        console.error(e);
    } finally {
        await closeBrowser();
        fs.unlinkSync(path.join(downloadPath, 'foo.txt'));
    }
})();