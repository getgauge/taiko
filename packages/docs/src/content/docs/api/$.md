---
title: "$()"
description: "This [selector](/api/selector/) lets you identify elements on the web page via XPath or CSS selector and proximity selectors."
---

This [selector](/api/selector/) lets you identify elements on the web page via XPath or CSS selector and proximity selectors.

## Examples

```js
await highlight($(`//*[text()='text']`))
```

```js
await $(`//*[text()='text']`).exists()
```

```js
$(`#id`,near('username'),below('login'))
```

```js
$(() => {return document.querySelector('#foo');})
```

```js
$((selector) => document.querySelector(selector), { args: '#foo' })
```

```js
$((selector) => document.getElementById(selector), { args: 'foo' })
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `attrValuePairs` | `unknown` |  |
| `_options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |
| `args` | [relativeSelector](/api/relativeselector/) | Proximity selectors |
| `selector` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | XPath or CSS selector or Function. |

## Returns

| Type | Description |
| --- | --- |
| [DollarWrapper](/api/dollarwrapper/) |  |
