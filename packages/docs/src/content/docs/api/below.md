---
title: "below()"
description: "Search relative HTML elements with this [relativeSelector](/api/relativeselector/)."
---

Search relative HTML elements with this [relativeSelector](/api/relativeselector/).

## Examples

```js
await click(link("Block", below("name"))
```

```js
await write(textBox("email", below("name"))
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `selector` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Web element selector. |

## Returns

| Type | Description |
| --- | --- |
| [RelativeSearchElement](/api/relativesearchelement/) | . |
