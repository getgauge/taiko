---
title: "write()"
description: "Types the given text into the focused or given element."
---

Types the given text into the focused or given element.

## Examples

```js
await write('admin')
```

```js
await write('admin', into(textBox("Username"),{force:true})
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `text` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Text to type into the element. |
| `into` | [selector](/api/selector/) \| [Element](/api/element/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | A selector of an element to write into. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{delay:0}`. |
| `options.delay` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Time to wait between key presses in milliseconds. Default: `0`. |
| `options.waitForNavigation` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Wait for navigation after the click. Default navigation timeout is 15 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter. Default: `true`. |
| `options.waitForStart` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | wait for navigation to start. Accepts time in milliseconds. Default: `100`. |
| `options.navigationTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Navigation timeout value in milliseconds for navigation after click. Default: `30000`. |
| `options.hideText` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Prevent given text from being written to log output. Default: `false`. |
| `options.force` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Set to true to perform action on hidden/disabled elements. Default: `false`. |
| `options.waitForEvents` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated'] Default: `[]`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
