---
title: "textBox()"
description: "This [selector](/api/selector/) lets you identify a text field(input (with type text, password, url, search, number, email, tel), textarea and contenteditable fields) on a web page either with label or with attribute and value pairs and proximity selectors."
---

This [selector](/api/selector/) lets you identify a text field(input (with type text, password, url, search, number, email, tel), textarea and contenteditable fields)
on a web page either with label or with attribute and value pairs and proximity selectors.

## Examples

```js
await focus(textBox('Username:'))
```

```js
await textBox('Username:').exists()
```

```js
await textBox({id:'textBoxId'},below('text')).exists()
```

```js
await textBox(below('text')).exists()
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
| [TextBoxWrapper](/api/textboxwrapper/) |  |
