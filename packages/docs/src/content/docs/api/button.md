---
title: "button()"
description: "This [selector](/api/selector/) lets you identify a button on a web page with label or attribute and value pairs and proximity selectors. Tags button and input with type submit, reset and button are identified using this selector"
---

This [selector](/api/selector/) lets you identify a button on a web page with label or attribute and value pairs and proximity selectors.
Tags button and input with type submit, reset and button are identified using this selector

## Examples

```js
await highlight(button('Get Started'))
```

```js
await button('Get Started').exists()
```

```js
await button({id:'buttonId'}).exists()
```

```js
await button({id:'buttonId'},below('text')).exists()
```

```js
await button(below('text')).exists()
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `attrValuePairs` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | Pairs of attribute and value like {"id":"name","class":"class-name"} |
| `_options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |
| `args` | [relativeSelector](/api/relativeselector/) | Proximity selectors |
| `label` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | The button label. |

## Returns

| Type | Description |
| --- | --- |
| [ButtonWrapper](/api/buttonwrapper/) |  |
