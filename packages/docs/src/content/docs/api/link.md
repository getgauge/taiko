---
title: "link()"
description: "This [selector](/api/selector/) lets you identify a link on a web page with text or attribute and value pairs and proximity selectors."
---

This [selector](/api/selector/) lets you identify a link on a web page with text or attribute and value pairs and proximity selectors.

## Examples

```js
await click(link('Get Started'))
```

```js
await link('Get Started').exists()
```

```js
await link({id:'linkId'}).exists()
```

```js
await link({id:'linkId'},below('text')).exists()
```

```js
await link(below('text')).exists()
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `attrValuePairs` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | Pairs of attribute and value like {"id":"name","class":"class-name"} |
| `_options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |
| `args` | [relativeSelector](/api/relativeselector/) | Proximity selectors |
| `text` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | The link text. |

## Returns

| Type | Description |
| --- | --- |
| [LinkWrapper](/api/linkwrapper/) |  |
