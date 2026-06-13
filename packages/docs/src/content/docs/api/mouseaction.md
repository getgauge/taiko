---
title: "mouseAction()"
description: "Performs the given mouse action on the given coordinates. This is useful in performing actions on canvas."
---

Performs the given mouse action on the given coordinates. This is useful in performing actions on canvas.

## Examples

```js
await mouseAction('press', {x:0,y:0})
```

```js
await mouseAction('move', {x:9,y:9})
```

```js
await mouseAction('release', {x:9,y:9})
```

```js
await mouseAction($("#elementID"),'press', {x:0,y:0})
```

```js
await mouseAction($(".elementClass"),'move', {x:9,y:9})
```

```js
await mouseAction($("testxpath"),'release', {x:9,y:9})
```

```js
await mouseAction('release', {x:9, y:9}, {navigationTimeout: 30000})
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `action` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Action to be performed on the canvas |
| `coordinates` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | Coordinates of a point on canvas to perform the action. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  |

## Returns

This API does not return any values.
