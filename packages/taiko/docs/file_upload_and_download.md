---
layout: page.njk
---

## Attaching files

You can use the [`attach`](/api/attach) API to upload 
files in your test scripts as follows

    const { goto, fileField, button, above, 
        attach, click, text } = require('taiko'),

    (async () => {
    try {
        await openBrowser();
        await goto('http://example.org/upload');
        await attach(path.join(__dirname, 'data', 'foo.txt'), 
            fileField(above(button('Upload'))));
        await click('Upload');
    } catch (e) {
        console.error(e);
    } finally {
        await closeBrowser();
    }
    })();

The code above attaches the file `data/foo.txt` from the 
current folder to a file field near a button with the name 'Upload'. You
can also use the [`fileField`](/api/fileField) API with other selectors.

## Downloading files

The following code shows how to configure a Taiko test to download files

    const { goto, client, click } = require('taiko'),
    path = require('path'),
    fs = require('fs'),
    assert = require('assert')

    (async () => {
    var downloadPath = path.resolve(__dirname, 'data', 'downloaded');
    try {
        await openBrowser();
        await client().send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath,
        });
        await goto('http://example.org/download');

        // ensure that file_upload.js is run before this, 
        // to allow the file to be available for download
        await click('foo.txt');
        sleep(1000);
        expect(path.join(downloadPath, 'foo.txt')).to.exist;

        assert.ok(fs.existsSync(path.join(downloadPath, 'foo.txt'))) 
    } catch (e) {
        console.error(e);
    } finally {
        await closeBrowser();
        if (fs.existsSync(path.join(downloadPath, 'foo.txt'))) {
        fs.unlinkSync(path.join(downloadPath, 'foo.txt'));
        }
    }
    })();


You can also use node's `fs` API to read the contents of the file and
use it in your assertions.