---
title: "listItem()"
description: "This [selector](/api/selector/) lets you identify a list item (HTML `<li>` element) on a web page with label or attribute and value pairs and proximity selectors."
---

This [selector](/api/selector/) lets you identify a list item (HTML `<li>` element) on a web page with label or attribute and value pairs and proximity selectors.

## Examples

```js
await highlight(listItem('Get Started'))
```

```js
await listItem('Get Started').exists()
```

```js
await listItem({id:'listId'}).exists()
```

```js
await listItem({id:'listItemId'},below('text')).exists()
```

```js
await listItem(below('text')).exists()
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `attrValuePairs` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | Pairs of attribute and value like {"id":"name","class":"class-name"} |
| `_options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |
| `args` | [relativeSelector](/api/relativeselector/) | Proximity selectors |
| `label` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | The label of the list item. |

## Returns

| Type | Description |
| --- | --- |
| [ListItemWrapper](/api/listitemwrapper/) |  |
