---
title: "text()"
description: "This [selector](/api/selector/) lets you identify an element with text. Looks for exact match if not found does contains, accepts proximity selectors."
---

This [selector](/api/selector/) lets you identify an element with text. Looks for exact match if not found does contains, accepts proximity selectors.

## Examples

```js
await highlight(text('Vehicle'))
```

```js
await text('Vehicle').exists()
```

```js
await text('Vehicle', below('text')).exists()
```

```js
await text('Vehicle', { exactMatch: true }, below('text')).exists()
```

```js
await text('/Vehicle/').exists() //regex as string
```

```js
await text(/Vehicle/).exists()
```

```js
await text(new RegExp('Vehicle')).exists()
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `text` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [RegExp](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/RegExp) | Text/regex to match. |
| `_options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  |
| `_options.exactMatch` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Option to look for exact match. Default: `false`. |
| `args` | [relativeSelector](/api/relativeselector/) | Proximity selectors |

## Returns

| Type | Description |
| --- | --- |
| [TextWrapper](/api/textwrapper/) |  |
