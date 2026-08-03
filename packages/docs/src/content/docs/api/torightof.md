---
title: "toRightOf()"
description: "Search relative HTML elements with this [relativeSelector](/api/relativeselector/)."
---

Search relative HTML elements with this [relativeSelector](/api/relativeselector/).

## Examples

```js
await click(link("Block", toRightOf("name"))
```

```js
await write(textBox("last name", toRightOf("first name"))
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `selector` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Web element selector. |

## Returns

| Type | Description |
| --- | --- |
| [RelativeSearchElement](/api/relativesearchelement/) | . |
