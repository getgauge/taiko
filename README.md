# Taiko

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT) [![alpha software]( https://img.shields.io/badge/status-alpha-lightgrey.svg)](https://github.com/getgauge/taiko/issues) [![npm version](https://badge.fury.io/js/taiko.svg?style=flat-square)](https://badge.fury.io/js/taiko) [![dependencies Status](https://david-dm.org/getgauge/taiko/status.svg)](https://david-dm.org/getgauge/taiko) [![devDependencies Status](https://david-dm.org/getgauge/taiko/dev-status.svg)](https://david-dm.org/getgauge/taiko?type=dev) [![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/getgauge/taiko/issues)

### Browser automation simplified

![Taiko REPL](https://user-images.githubusercontent.com/54427/43075023-f4d18878-8e9c-11e8-91b2-227a3d02e0f6.gif)

## Getting started

Clone taiko repo
```
git clone https://github.com/getgauge/taiko.git
```

### Command Line Interface

```
npm install -g <path_to_taiko_repo>
```

> On Windows, make sure that the location `%AppData%\npm`(or wherever `npm` ends up installing the module on your Windows flavor) is present in `PATH` environment variable.

> On Linux, install `taiko` to a [`NODE_PATH`](https://nodejs.org/api/modules.html#modules_loading_from_the_global_folders) with executable permission.

### Run tests
Test are written using [gauge](https://gauge.org). Install and setup gauge following instructions [here](https://gauge.org/get_started/)

```
git clone https://github.com/getgauge-examples/js-taiko.git
cd js-taiko
npm install
```
```gauge run specs``` or ```gauge run specs --tags=\!knownIssue``` (to ignore specs for knownissue)



## Usage

#### Command line

Use the [Read–eval–print Loop](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) to record a script.

```js
$ taiko

> openBrowser()
✔ Browser and page initialized

> goto("http://todomvc.com/examples/react/#/");
✔ Navigated to url "http://todomvc.com/examples/react/#/"

> write("automate with taiko");
✔ Wrote automate with taiko into the focused element.

> press("Enter");
✔ Pressed the Enter key

> click(checkBox(near("automate with taiko")));
✔ Clicked checkbox Near automate with taiko

> .code
const { openBrowser, goto, write, press, near, checkBox, click } = require('taiko');

(async () => {
    await openBrowser({headless:false});
    await goto("http://todomvc.com/examples/react/#/");
    await write("automate with taiko");
    await press("Enter");
    await click(checkBox(near("automate with taiko")));
    closeBrowser();
})();

> .code code.js
```

### Running a taiko script

```
$ taiko code.js
```

### As a Module
```
$ npm install <path_to_taiko_repo> --save
$ node code.js
```

## Documentation

* [API](http://taiko.gauge.org)

## Inspired by

* [Helium](https://heliumhq.com/)
* [Puppeteer](https://github.com/GoogleChrome/puppeteer)

## Talk to us

For queries and contributions talk to the [Gauge](https://github.com/getgauge/gauge/#talk-to-us) team.

## Copyright

Copyright 2018 [ThoughtWorks, Inc](https://www.thoughtworks.com/)
