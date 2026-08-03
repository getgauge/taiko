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
| `options.url` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | sets cookie with the URL. Default: `undefined`. |
| `options.domain` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | sets cookie with the exact domain. Default: `undefined`. |
| `options.path` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | sets cookie with the exact path. Default: `undefined`. |
| `options.secure` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | True if cookie to be set is secure. Default: `undefined`. |
| `options.httpOnly` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | True if cookie to be set is http-only. Default: `undefined`. |
| `options.sameSite` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Represents the cookie's 'SameSite' status: Refer [https://tools.ietf.org/html/draft-west-first-party-cookies](https://tools.ietf.org/html/draft-west-first-party-cookies). Default: `undefined`. |
| `options.expires` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | UTC time in seconds, counted from January 1, 1970. eg: 2019-02-16T16:55:45.529Z Default: `undefined`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
