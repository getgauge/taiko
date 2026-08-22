---
title: "press()"
description: "Presses the given keys."
---

Presses the given keys.

## Examples

```js
await press('Enter')
```

```js
await press('a')
```

```js
await press(['Shift', 'ArrowLeft', 'ArrowLeft'])
```

```js
awaitpress('a', { waitForNavigation: false })
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `keys` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)> | Name of keys to press. See [USKeyboardLayout](https://github.com/getgauge/taiko/blob/master/lib/data/USKeyboardLayout.js) for a list of all key names. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |
| `options.text` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | If specified, generates an input event with this text. Default: `""`. |
| `options.delay` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Time to wait between keydown and keyup in milliseconds. Default: `0`. |
| `options.waitForNavigation` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Wait for navigation after the click. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter. Default: `true`. |
| `options.waitForStart` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | wait for navigation to start. Default: `100`. |
| `options.navigationTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Navigation timeout value in milliseconds for navigation after click. Default: `30000`. |
| `options.waitForEvents` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated'] Default: `[]`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
