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

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
