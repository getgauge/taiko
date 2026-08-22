---
title: "scrollUp()"
description: "Scrolls up the page/element."
---

Scrolls up the page/element.

## Examples

```js
await scrollUp()
```

```js
await scrollUp(1000)
```

```js
await scrollUp('Element containing text')
```

```js
await scrollUp('Element containing text', 1000)
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
