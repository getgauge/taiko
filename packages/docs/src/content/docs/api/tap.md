---
title: "tap()"
description: "Fetches an element with the given selector, scrolls it into view if needed, and then taps on the element. If there's no element matching selector, the method throws an error."
---

Fetches an element with the given selector, scrolls it into view if needed, and then taps on the element. If there's no element matching selector, the method throws an error.

## Examples

```js
await tap('Gmail')
```

```js
await tap(link('Gmail'))
```

```js
tap(link('Gmail'), { waitForNavigation: true, waitForEvents: ['firstMeaningfulPaint'],  force: true });
```

```js
tap(link('Gmail'), {}, below('title'))
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `selector` | [selector](/api/selector/) |  |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |
| `options.waitForNavigation` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | - Wait for navigation after the click. Default navigation timeout is 15 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter. Default: `true`. |
| `options.force` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Set to true to perform action on hidden/disabled elements. Default: `false`. |
| `options.waitForEvents` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated'] Default: `[]`. |
| `args` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Proximity selectors |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
