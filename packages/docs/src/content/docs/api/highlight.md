---
title: "highlight()"
description: "Highlights the given element on the page by drawing a red rectangle around it. This is useful for debugging purposes."
---

Highlights the given element on the page by drawing a red rectangle around it. This is useful for debugging purposes.

## Examples

```js
await highlight('Get Started')
```

```js
await highlight(link('Get Started'))
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `selector` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | A selector of an element to highlight. If there are multiple elements satisfying the selector, the first will be highlighted. |
| `args` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Proximity selectors |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
