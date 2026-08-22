---
title: "radioButton()"
description: "This [selector](/api/selector/) lets you identify a radio button on a web page either with label or with attribute and value pairs and proximity selectors."
---

This [selector](/api/selector/) lets you identify a radio button on a web page either with label or with attribute and value pairs and proximity selectors.

## Examples

```js
await radioButton('Vehicle').exists()
```

```js
await radioButton({id:'radioButtonId'},below('text')).exists()
```

```js
await radioButton(below('text')).exists()
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `labelOrAttrValuePairs` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | Either the label (human-visible name) of the text field or pairs of attribute and value like {"id":"name","class":"class-name"} |
| `_options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  |
| `args` | [relativeSelector](/api/relativeselector/) |  |

## Returns

| Type | Description |
| --- | --- |
| [RadioButtonWrapper](/api/radiobuttonwrapper/) |  |
