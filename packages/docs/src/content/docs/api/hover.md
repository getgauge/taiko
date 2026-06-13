---
title: "hover()"
description: "Fetches an element with the given selector, scrolls it into view if needed, and then hovers over the center of the element. If there's no element matching selector, the method throws an error."
---

Fetches an element with the given selector, scrolls it into view if needed, and then hovers over the center of the element. If there's no element matching selector, the method throws an error.

## Examples

```js
await hover('Get Started')
```

```js
await hover(link('Get Started'))
```

```js
await hover(link('Get Started'), { waitForEvents: ['firstMeaningfulPaint'],  force: true })
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `selector` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | A selector to search for element to right click. If there are multiple elements satisfying the selector, the first will be hovered. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |

## Returns

This API does not return any values.
