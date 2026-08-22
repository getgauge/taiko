---
title: "toLeftOf()"
description: "Search relative HTML elements with this [relativeSelector](/api/relativeselector/)."
---

Search relative HTML elements with this [relativeSelector](/api/relativeselector/).

## Examples

```js
await click(link("Block", toLeftOf("name"))
```

```js
await write(textBox("first name", toLeftOf("last name"))
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `selector` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Web element selector. |

## Returns

| Type | Description |
| --- | --- |
| [RelativeSearchElement](/api/relativesearchelement/) | . |
