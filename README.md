# Taiko

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT) [![npm version](https://badge.fury.io/js/taiko.svg)](https://badge.fury.io/js/taiko) [![dependencies Status](https://david-dm.org/getgauge/taiko/status.svg)](https://david-dm.org/getgauge/taiko) [![devDependencies Status](https://david-dm.org/getgauge/taiko/dev-status.svg)](https://david-dm.org/getgauge/taiko?type=dev)

An easy to use wrapper over Google Chrome's Puppeteer library.


![peek 2017-12-11 17-05](https://user-images.githubusercontent.com/54427/33867170-c2d1b8a6-df20-11e7-927b-4a5e007a6c1e.gif)

## Getting started

### Command Line Interface

```
npm install -g taiko
```

> On Windows, make sure that the location `%AppData%\npm`(or wherever `npm` ends up installing the module on your Windows flavor) is present in `PATH` environment variable.

> On Linux, install `taiko` to a [`NODE_PATH`](https://nodejs.org/api/modules.html#modules_loading_from_the_global_folders) with executable permission.

### As a Module
```
npm install taiko --save
```

## Usage

#### Command line

Use the [Read–eval–print Loop](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) to record a script.

```js
$ taiko
> openBrowser()
 ✔ Browser and page initialized

> goto('https://getgauge.io')
 ✔ Navigated to url "https://getgauge.io/"

> click('Get Started')
 ✔ Clicked element containing text "Get Started"

> .code
const { openBrowser, goto, click, closeBrowser } = require('taiko');

(async () => {
    try {
        await openBrowser();
        await goto('https://getgauge.io');
        await click('Get Started');
        await closeBrowser();
    } catch (e) {
        console.error(e);
        closeBrowser();
    }
})();

> .code code.js
```

### Running a taiko script

```
$ taiko code.js
```

### As a Module


```js
const { openBrowser, goto, click, closeBrowser } = require('taiko');

(async () => {
    await openBrowser();
    await goto('https://getgauge.io');
    await click('Get Started');
    await closeBrowser();
})();
```

## Documentation

* [API](https://getgauge.github.io/taiko/)
