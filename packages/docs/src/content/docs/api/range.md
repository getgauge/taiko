---
title: "range()"
description: "This [selector](/api/selector/) let you specify a value which must be no less than a given value, and no more than another given value,attribute and value pairs and proximity selectors. This is typically represented using a slider or dial control rather than a text entry box like the number input type."
---

This [selector](/api/selector/) let you specify a value which must be no less than a given value, and no more than another given value,attribute and value pairs and proximity selectors.
This is typically represented using a slider or dial control rather than a text entry box like the number input type.

## Examples

```js
await range({ id: 'range-1' }).select(10.81);
```

```js
await range({ id: 'range-1' }).select('10');
```

```js
await range({ id: 'range-1' }, below('head')).select(10);
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `_options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  |
| `attrValuePairs` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | Pairs of attribute and value like {"id":"name","class":"class-name"} |
| `args` | [relativeSelector](/api/relativeselector/) | Proximity selectors |

## Returns

| Type | Description |
| --- | --- |
| [RangeWrapper](/api/rangewrapper/) |  |
