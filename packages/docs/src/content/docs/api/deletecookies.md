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
| `options.url` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | deletes all the cookies with the given name where domain and path match provided URL. eg: [https://google.com](https://google.com) Default: `undefined`. |
| `options.domain` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | deletes only cookies with the exact domain. eg: google.com Default: `undefined`. |
| `options.path` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | deletes only cookies with the exact path. eg: Google/Chrome/Default/Cookies/.. Default: `undefined`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
