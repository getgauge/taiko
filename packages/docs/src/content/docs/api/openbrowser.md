---
title: "openBrowser()"
description: "Launches a browser with a tab. The browser will be closed when the parent node.js process is closed.<br> Note : `openBrowser` launches the browser in headless mode by default, but when `openBrowser` is called from [repl](/api/repl/) it launches the browser in headful mode."
---

Launches a browser with a tab. The browser will be closed when the parent node.js process is closed.<br>
Note : `openBrowser` launches the browser in headless mode by default, but when `openBrowser` is called from [repl](/api/repl/) it launches the browser in headful mode.

## Examples

```js
await openBrowser({headless: false})
```

```js
await openBrowser()
```

```js
await openBrowser({args:['--window-size=1440,900']})
```

```js
await openBrowser({args: [
     '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-sandbox',
      '--no-zygote']}) # These are recommended args that has to be passed when running in docker
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | eg. {headless: true\|false, args:['--window-size=1440,900']} Default: `{headless:true}`. |
| `options.headless` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Option to open browser in headless/headful mode. Default: `true`. |
| `options.args` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | [Chromium browser launch options](https://peter.sh/experiments/chromium-command-line-switches/). Default: `[]`. |
| `options.host` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Remote host to connect to. Default: `'127.0.0.1'`. |
| `options.target` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Determines which target the client should interact.([https://github.com/cyrus-and/chrome-remote-interface#cdpoptions-callback](https://github.com/cyrus-and/chrome-remote-interface#cdpoptions-callback)) |
| `options.port` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Remote debugging port, if not given connects to any open port. Default: `0`. |
| `options.useHostName` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | If the browser should be called using the hostname itself or with IP address Default: `false`. |
| `options.secure` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | HTTPS/WSS frontend. Defaults to false. Default: `false`. |
| `options.ignoreCertificateErrors` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Option to ignore certificate errors. Default: `true`. |
| `options.observe` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Option to run each command after a delay. Useful to observe what is happening in the browser. Default: `false`. |
| `options.observeTime` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Option to modify delay time for observe mode. Accepts value in milliseconds. Default: `3000`. |
| `options.dumpio` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Option to dump IO from browser. Default: `false`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
