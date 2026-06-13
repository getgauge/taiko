---
title: "above()"
description: "Search relative HTML elements with this [relativeSelector](/api/relativeselector/)."
---

Search relative HTML elements with this [relativeSelector](/api/relativeselector/).

## Examples

```js
await click(link("Block", above("name"))
```

```js
await write(textBox("name", above("email"))
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `selector` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Web element selector. |

## Returns

| Type | Description |
| --- | --- |
| [RelativeSearchElement](/api/relativesearchelement/) | . |
