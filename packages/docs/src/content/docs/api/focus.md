---
title: "focus()"
description: "Fetches an element with the given selector and focuses it. If there's no element matching selector, the method throws an error."
---

Fetches an element with the given selector and focuses it. If there's no element matching selector, the method throws an error.

## Examples

```js
await focus(textBox('Username:'))
```

```js
await focus(textBox('Username:'), { waitForEvents: ['firstMeaningfulPaint'], force: true })
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `selector` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | A selector of an element to focus. If there are multiple elements satisfying the selector, the first will be focused. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |

## Returns

This API does not return any values.
