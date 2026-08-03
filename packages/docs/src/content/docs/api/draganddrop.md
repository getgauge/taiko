---
title: "dragAndDrop()"
description: "Fetches the source element with given selector and moves it to given destination selector or moves for given distance. If there's no element matching selector, the method throws an error. Drag and drop of HTML5 draggable does not work as expected, refer [https://github.com/getgauge/taiko/issues/279](https://github.com/getgauge/taiko/issues/279)"
---

Fetches the source element with given selector and moves it to given destination selector
or moves for given distance. If there's no element matching selector, the method throws an error.
Drag and drop of HTML5 draggable does not work as expected, refer [https://github.com/getgauge/taiko/issues/279](https://github.com/getgauge/taiko/issues/279)

## Examples

```js
await dragAndDrop($("work"),into($('work done')))
```

```js
await dragAndDrop($("work"),{up:10,down:10,left:10,right:10}, { force: true})
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `source` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Element to be Dragged |
| `destination` | `unknown` |  |
| `options` | `unknown` |  Default: `{}`. |
| `destinationOrDistance` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | Element for dropping the dragged element<br>or an object specifying the drag&drop distance to be moved from position of source element |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
