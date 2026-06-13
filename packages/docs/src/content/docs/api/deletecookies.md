---
title: "deleteCookies()"
description: "Deletes browser cookies with matching name and URL or domain/path pair. If cookie name is not given or empty, all browser cookies are deleted."
---

Deletes browser cookies with matching name and URL or domain/path pair. If cookie name is not given or empty, all browser cookies are deleted.

## Examples

```js
await deleteCookies() # clears all browser cookies
```

```js
await deleteCookies("CSRFToken", {url: "http://the-internet.herokuapp.com"})
```

```js
await deleteCookies("CSRFToken", {domain: "herokuapp.com"})
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `cookieName` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Cookie name. Default: `undefined`. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
