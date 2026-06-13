---
title: "image()"
description: "This [selector](/api/selector/) lets you identify an image on a web page. This is done via the image's alt text or attribute and value pairs and proximity selectors."
---

This [selector](/api/selector/) lets you identify an image on a web page. This is done via the image's alt text or attribute and value pairs
and proximity selectors.

## Examples

```js
await click(image('alt'))
```

```js
await image('alt').exists()
```

```js
await image({id:'imageId'}).exists()
```

```js
await image({id:'imageId'},below('text')).exists()
```

```js
await image(below('text')).exists()
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `attrValuePairs` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | Pairs of attribute and value like {"id":"name","class":"class-name"} |
| `_options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |
| `args` | [relativeSelector](/api/relativeselector/) | Proximity selectors |
| `alt` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | The image's alt text. |

## Returns

| Type | Description |
| --- | --- |
| [ImageWrapper](/api/imagewrapper/) |  |
