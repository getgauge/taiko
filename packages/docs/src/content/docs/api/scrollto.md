---
title: "scrollTo()"
description: "Scrolls the page to the given element. The alignment parameters can be overridden, see below. A reference of the possible values for the alignment parameters is available at [https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView)."
---

Scrolls the page to the given element.
The alignment parameters can be overridden, see below.
A reference of the possible values for the alignment parameters is available at [https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView).

## Examples

```js
await scrollTo('Get Started')
```

```js
await scrollTo(link('Get Started'))
```

```js
await scrollTo('Get Started', { blockAlignment: 'center', inlineAlignment: 'center' })
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `selector` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | A selector of an element to scroll to. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |
| `options.waitForNavigation` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Wait for navigation after the goto. Default navigationTimeout is 30 seconds to override pass `{ navigationTimeout: 10000 }` in `options` parameter. Default: `true`. |
| `options.waitForEvents` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated'] Default: `[]`. |
| `options.navigationTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Navigation timeout value in milliseconds for navigation after click. Default: `30000`. |
| `options.waitForStart` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Time to wait for navigation to start. Accepts value in milliseconds. Default: `100`. |
| `options.blockAlignment` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Defines vertical alignment. One of `start`, `center`, `end` or `nearest`. Default: `'nearest'`. |
| `options.inlineAlignment` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Defines horizontal alignment. One of `start`, `center`, `end` or `nearest`. Default: `'nearest'`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
