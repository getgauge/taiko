---
title: "color()"
description: "This [selector](/api/selector/) lets you set color values on color picker on web page with attribute and value pairs and proximity selectors."
---

This [selector](/api/selector/) lets you set color values on color picker on web page with attribute and value pairs and proximity selectors.

## Examples

```js
await color({'id':'colorId'}).exists()
```

```js
await color({id:'colorId'},below('text')).exists()
```

```js
await color(below('text')).exists()
```

```js
await color(below('text')).select('#f236cf')
```

```js
await color({'id':'colorId'}).select('#f236cf')
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `attrValuePairs` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | Pairs of attribute and value like {"id":"name","class":"class-name"} |
| `_options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  |
| `args` | [relativeSelector](/api/relativeselector/) | Proximity selectors |

## Returns

| Type | Description |
| --- | --- |
| [ColorWrapper](/api/colorwrapper/) |  |
