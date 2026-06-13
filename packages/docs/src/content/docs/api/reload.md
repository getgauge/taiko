---
title: "reload()"
description: "Reloads the page."
---

Reloads the page.

## Examples

```js
await reload('https://google.com')
```

```js
await reload('https://google.com', { navigationTimeout: 10000 })
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `url` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | DEPRECATED URL to reload |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{navigationTimeout:defaultConfig.navigationTimeout}`. |
| `options.waitForNavigation` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Wait for navigation after the reload. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter. Default: `true`. |
| `options.waitForEvents` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated'] Default: `[]`. |
| `options.navigationTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Navigation timeout value in milliseconds for navigation after click. Default: `30000`. |
| `options.waitForStart` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | time to wait for navigation to start. Accepts value in milliseconds. Default: `100`. |
| `options.ignoreCache` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Ignore Cache on reload - Default to false Default: `false`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
