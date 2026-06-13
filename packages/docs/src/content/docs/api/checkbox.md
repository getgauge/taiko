---
title: "checkBox()"
description: "This [selector](/api/selector/) lets you identify a checkbox on a web page either with label or with attribute and value pairs and proximity selectors."
---

This [selector](/api/selector/) lets you identify a checkbox on a web page either with label or with attribute and value pairs and proximity selectors.

## Examples

```js
await checkBox('Vehicle').uncheck()
```

```js
await checkBox('Vehicle').exists()
```

```js
await checkBox({id:'checkBoxId'},below('text')).exists()
```

```js
await checkBox(below('text')).exists()
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `labelOrAttrValuePairs` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | Either the label (human-visible name) of the text field or pairs of attribute and value like {"id":"name","class":"class-name"} |
| `_options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  |
| `args` | [relativeSelector](/api/relativeselector/) | Proximity selectors |

## Returns

| Type | Description |
| --- | --- |
| [CheckBoxWrapper](/api/checkboxwrapper/) |  |
