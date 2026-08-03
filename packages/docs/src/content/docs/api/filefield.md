---
title: "fileField()"
description: "This [selector](/api/selector/) lets you identify a file input field on a web page either with label or with attribute and value pairs and proximity selectors."
---

This [selector](/api/selector/) lets you identify a file input field on a web page either with label or with attribute and value pairs and proximity selectors.

## Examples

```js
await attach('file.txt', to(fileField('Please select a file:')))
```

```js
await fileField('Please select a file:').exists()
```

```js
await fileField({'id':'file'}).exists()
```

```js
await fileField({id:'fileFieldId'},below('text')).exists()
```

```js
await fileField(below('text')).exists()
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
| [FileFieldWrapper](/api/filefieldwrapper/) |  |
