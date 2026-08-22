---
title: "timeField()"
description: "This [selector](/api/selector/) lets you identify time based input types [ date, datetime-local, month, time, week ] on a web page either with label or with attribute and value pairs and proximity selectors."
---

This [selector](/api/selector/) lets you identify time based input types [ date, datetime-local, month, time, week ] on a web page either with label
or with attribute and value pairs and proximity selectors.

## Examples

```js
await write('31082020', into(timeField('Birthday:')))
```

```js
await timeField('Birthday:').select(new Date('2020-09-20'))
```

```js
await timeField('Birthday:').exists()
```

```js
await timeField({'id':'Birthday'}).exists()
```

```js
await timeField({id:'Birthday'},below('text')).exists()
```

```js
await timeField(below('text')).exists()
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `label` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | The label (human-visible name) of the file input field. |
| `_options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  |
| `attrValuePairs` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | Pairs of attribute and value like {"id":"name","class":"class-name"} |
| `args` | [relativeSelector](/api/relativeselector/) | Proximity selectors |

## Returns

| Type | Description |
| --- | --- |
| [TimeFieldWrapper](/api/timefieldwrapper/) |  |
