---
title: "near()"
description: "Search relative HTML elements with this [relativeSelector](/api/relativeselector/). An element is considered nearer to a reference element, only if the element offset is lesser than the 30px of the reference element in any direction. Default offset is 30px to override set options = {offset:50}"
---

Search relative HTML elements with this [relativeSelector](/api/relativeselector/).
An element is considered nearer to a reference element,
only if the element offset is lesser than the 30px of the reference element in any direction.
Default offset is 30px to override set options = {offset:50}

## Examples

```js
await click(link("Block", near("name"))
```

```js
await click(link("Block", near("name", {offset: 50}))
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `selector` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Web element selector. |
| `opts` | `unknown` |  Default: `{offset:30}`. |

## Returns

| Type | Description |
| --- | --- |
| [RelativeSearchElement](/api/relativesearchelement/) | . |
