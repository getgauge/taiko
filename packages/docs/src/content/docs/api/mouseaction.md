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
| `options.waitForNavigation` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Wait for navigation after the click. Default navigation timeout is 30 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter. Default: `true`. |
| `options.navigationTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Navigation timeout value in milliseconds for navigation after click. Default: `30000`. |
| `options.waitForEvents` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated'] Default: `[]`. |
| `options.waitForStart` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | time to wait for navigation to start. Accepts time in milliseconds. Default: `100`. |
| `options.force` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Set to true to perform action on hidden/disabled elements. Default: `false`. |

## Returns

This API does not return any values.
