---
title: "dropDown()"
description: "This [selector](/api/selector/) lets you identify a dropDown on a web page either with label or with attribute and value pairs and proximity selectors. Any value can be selected using value or text or index of the options."
---

This [selector](/api/selector/) lets you identify a dropDown on a web page either with label or with attribute and value pairs and proximity selectors.
Any value can be selected using value or text or index of the options.

## Examples

```js
await dropDown('Vehicle:').select('Car')
```

```js
await dropDown('Vehicle:').select({index:'0'}) - index starts from 0
```

```js
await dropDown('Vehicle:').value()
```

```js
await dropDown('Vehicle:').options() - Returns all available options from the drop down
```

```js
await dropDown('Vehicle:').exists()
```

```js
await dropDown({id:'dropDownId'},below('text')).exists()
```

```js
await dropDown(below('text')).exists()
```

```js
await dropDown('Vehicle:').select(/Car/) // Only matches drop down text and not the value
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
| [DropDownWrapper](/api/dropdownwrapper/) |  |
