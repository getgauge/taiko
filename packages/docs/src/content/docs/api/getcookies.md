---
title: "getCookies()"
description: "Get browser cookies"
---

Get browser cookies

## Examples

```js
await getCookies()
```

```js
await getCookies({urls:['https://the-internet.herokuapp.com']})
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |
| `options.urls` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | The list of URLs for which applicable cookies will be fetched Default: `undefined`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)>> | Array of cookie objects |
