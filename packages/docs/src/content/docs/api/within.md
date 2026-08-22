---
title: "within()"
description: "Search relative HTML elements with this [relativeSelector](/api/relativeselector/). An element is considered within a reference element, only if the element's bounding box is in range of reference element."
---

Search relative HTML elements with this [relativeSelector](/api/relativeselector/).
An element is considered within a reference element,
only if the element's bounding box is in range of reference element.

## Examples

```js
await click(link("Block", within("name"))
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `selector` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Web element selector. |

## Returns

| Type | Description |
| --- | --- |
| [RelativeSearchElement](/api/relativesearchelement/) | . |
