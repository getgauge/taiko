---
title: "scrollRight()"
description: "Scrolls the page/element to the right."
---

Scrolls the page/element to the right.

## Examples

```js
await scrollRight()
```

```js
await scrollRight(1000)
```

```js
await scrollRight('Element containing text')
```

```js
await scrollRight('Element containing text', 1000)
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `e` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) |  Default: `'Window'`. |
| `px` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Accept px in pixels Default: `100`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
