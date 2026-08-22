---
title: "openTab()"
description: "Launches a new tab. If url is provided, the new tab is opened with the url loaded."
---

Launches a new tab. If url is provided, the new tab is opened with the url loaded.

## Examples

```js
await openTab('https://taiko.dev')
```

```js
await openTab() # opens a blank tab.
```

```js
await openTab('https://taiko.dev', {name: 'taiko'}) # Tab with identifier
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `targetUrl` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Url of page to open in newly created tab. Default: `undefined`. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |
| `options.waitForNavigation` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Wait for navigation after the reload. Default navigation timeout is 5000 milliseconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter. Default: `true`. |
| `options.name` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Tab identifier |
| `options.navigationTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Navigation timeout value in milliseconds for navigation after click. Accepts value in milliseconds. Default: `5000`. |
| `options.waitForStart` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | time to wait to check for occurrence of page load events. Accepts value in milliseconds. Default: `100`. |
| `options.waitForEvents` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Page load events to implicitly wait for. Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated'] Default: `[]`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
