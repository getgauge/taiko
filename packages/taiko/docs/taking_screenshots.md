---
layout: page.njk
---

Taiko's [`screenshot`](/api/screenshot) API can save images of the page you 
are testing. 

Since Taiko uses the browser to capture screenshots, this 
works on headless mode. Here are a few ways to work with screenshots.

## Default screenshot

You can use Taiko's `screenshot` API to take screenshots 
of a web page. For example in the REPL (after navigating to a web page)

```
> screenshot()
✔ Screenshot is created at Screenshot-1592405213958.png
```

or in a script using

```
const { openBrowser, goto, screenshot, closeBrowser } = require('taiko');
(async () => {
  await openBrowser();
  await goto('google.com');
  await screenshot();
})();
```

The snippets above saves a screenshot of `google.com` in the scripts
directory with a randomised name in the format `Screenshot-xxx`.

## Custom location

To save screenshots to a custom location you can use the optional 
attribute `path` for example in the REPL

```
> screenshot({path: 'screenshot.png'})
✔ Screenshot is created at screenshot.png
```

Or in a script using

```
const { openBrowser, goto, screenshot, closeBrowser } = require('taiko');
(async () => {
  await openBrowser();
  await goto('google.com');
  await screenshot({path: 'screenshot.png'});
})();
```

## Full page screenshots

By default, screenshots are only of the visible area of the page which
inturn depends on the browser windows size. You can use the `fullPage` 
option to take a screenshot of the entire page for example

```
const { openBrowser, goto, screenshot, closeBrowser } = require('taiko');
(async () => {
  await openBrowser();
  await goto('google.com');
  await screenshot({fullPage: true});
})();
```

## Page section screenshot

Taiko's `screenshot` can also take screenshots of a specific section
of the web page using selectors for example

```
const { openBrowser, goto, screenshot, closeBrowser } = require('taiko');
(async () => {
  await openBrowser();
  await goto('google.com');
  await screenshot(button("Google Search"));
})();
```

## Screenshots in base64 format

Taiko's `screenshot` API can also return images in `base64` encoding
format. This is useful in case you want you don't want Taiko to save 
the file locally but want to use another library to save it.

```
const { openBrowser, goto, screenshot, closeBrowser } = require('taiko');
(async () => {
  await openBrowser();
  await goto('google.com');
  const base64Image = await screenshot({encoding: "base64"});
})();
```

## Taking screenshots with gauge

If you are using Gauge and Taiko you add the following snippet
in any of your Taiko test script

```
const path = require('path');
gauge.customScreenshotWriter = async function () {
    const screenshotFilePath = path.join(process.env['gauge_screenshots_dir'], `screenshot-${process.hrtime.bigint()}.png`);
    await screenshot({ path: screenshotFilePath });
    return path.basename(screenshotFilePath);
};
```
