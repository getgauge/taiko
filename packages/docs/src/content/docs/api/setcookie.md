---
title: "setCookie()"
description: "Sets a cookie with the given cookie data. It may overwrite equivalent cookie if it already exists."
---

Sets a cookie with the given cookie data. It may overwrite equivalent cookie if it already exists.

## Examples

```js
await setCookie("CSRFToken","csrfToken", {url: "http://the-internet.herokuapp.com"})
```

```js
await setCookie("CSRFToken","csrfToken", {domain: "herokuapp.com"})
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Cookie name. |
| `value` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Cookie value. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
