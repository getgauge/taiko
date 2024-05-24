# Taiko Examples

This folder contains samples inspired by some of selenium tips published by [elemental selenium](https://github.com/tourdedave/elemental-selenium-tips), but it uses taiko and demonstrates it against [The Internet Express](https://github.com/getgauge-contrib/the-internet-express)

## Table of Contents

1. [Upload a file](01-file_upload.js)

![Upload a file](gifs/file-upload.gif)

2. [Download a file](02-file_download.js)

![Downloada file](gifs/file-download.gif)

3. [Working with frames](03-work-with-frames.js)

![Upload a file](gifs/frames.gif)

4. [Handling windows/tabs](04-windows-tabs.js)

![Upload a file](gifs/windows.gif)

5. [Dropdown](05-dropdown.js)

![Upload a file](gifs/dropdown.gif)

6. [Basic Auth](06-basic-auth.js)

![Upload a file](gifs/basic-auth.gif)

7. [Dynamic Content](07-dynamic-loading.js)

![Upload a file](gifs/dynamic-pages.gif)

8. [Write into `contenteditable` elements](08-contenteditable.js)

![`contenteditable` Fields](gifs/contenteditable.gif)

## Running the examples

`npm test` runs the examples under a headless chromium.

> **Note:** The examples use `openBrowserAndStartScreencast` and `closeBrowserAndStopScreencast` from [`browserLauncher`](browser/launcher.js) instead of `openBrowser` and `closeBrowser` directly. This is to capture screen recordings. The `browserLauncher` methods can be substituted with `openBrowser` and `closeBrowser` if there is no need for screencast capture.

### Run Options

1. Observe

`npm test -- --observe` runs the examples under `observe` mode, which brings up the browser so that you can see the action.

2. Run a single example

`npm test -- <id>` where `id` is the file prefix. Ex. `npm test -- 05` will run just `05-dropdown.js`.

3. Screencast

`npm test -- --screencast` will run all the examples and record the session using the [`taiko-screencast`](https://github.com/getgauge-contrib/taiko-screencast) plugin. The output is saved under the `captures` directory.
