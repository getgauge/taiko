---
title: "click()"
description: "Fetches an element with the given selector, scrolls it into view if needed, and then clicks in the center of the element. If there's no element matching selector, the method throws an error."
---

Fetches an element with the given selector, scrolls it into view if needed, and then clicks in the center of the element. If there's no element matching selector, the method throws an error.

## Examples

```js
await click('Get Started')
```

```js
await click(link('Get Started'))
```

```js
await click({x : 170, y : 567})
```

```js
await click('Get Started', { navigationTimeout: 60000,  force: true })
```

```js
await click('Get Started', { navigationTimeout: 60000 }, below('text'))
```

```js
await click('Get Started', { navigationTimeout: 60000, position: 'right' }, below('text'))
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `selector` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | A selector to search for element to click / coordinates of the elemets to click on. If there are multiple elements satisfying the selector, the first will be clicked. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |
| `options.waitForNavigation` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Wait for navigation after the click. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter. Default: `true`. |
| `options.navigationTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Navigation timeout value in milliseconds for navigation after click. Default: `30000`. |
| `options.button` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | `left`, `right`, or `middle`. Default: `'left'`. |
| `options.clickCount` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Number of times to click on the element. Default: `1`. |
| `options.elementsToMatch` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Number of elements to loop through to match the element with given selector. Default: `10`. |
| `options.waitForEvents` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated'] Default: `[]`. |
| `options.waitForStart` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | time to wait for navigation to start. Accepts time in milliseconds. Default: `100`. |
| `options.force` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Set to true to perform action on hidden/disabled elements. Default: `false`. |
| `options.position` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Available positions right, left, topRight, topLeft, bottomRight, bottomLeft Default: `'right'`. |
| `args` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Proximity selectors |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
