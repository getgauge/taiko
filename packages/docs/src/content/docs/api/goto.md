---
title: "goto()"
description: "Opens the specified URL in the browser's tab. Adds `http` protocol to the URL if not present."
---

Opens the specified URL in the browser's tab. Adds `http` protocol to the URL if not present.

## Examples

```js
await goto('https://google.com')
```

```js
await goto('google.com')
```

```js
await goto('example.com',{ navigationTimeout:10000, headers:{'Authorization':'Basic cG9zdG1hbjpwYXNzd29y2A=='}})
```

```js
const response = await goto('gauge.org'); if(response.status.code === 200) {console.log("Success!!")}
response: {
redirectedResponse: [
 {
   url: 'http://gauge.org/',
   status: { code: 307, text: 'Internal Redirect' }
 }
],
url: 'https://gauge.org/',
status: { code: 200, text: '' }
}
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `url` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | URL to navigate page to. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{navigationTimeout:defaultConfig.navigationTimeout}`. |
| `options.waitForNavigation` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Wait for navigation after the goto. Default navigationTimeout is 30 seconds to override pass `{ navigationTimeout: 10000 }` in `options` parameter. Default: `true`. |
| `options.waitForEvents` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated'] Default: `[]`. |
| `options.navigationTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Navigation timeout value in milliseconds for navigation after click. Default: `30000`. |
| `options.headers` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | Map with extra HTTP headers. |
| `options.waitForStart` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | time to wait for navigation to start. Accepts value in milliseconds. Default: `100`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)> | response |
