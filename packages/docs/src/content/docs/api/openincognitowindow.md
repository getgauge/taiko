---
title: "openIncognitoWindow()"
description: "Opens the specified URL in the browser's window. Adds `http` protocol to the URL if not present."
---

Opens the specified URL in the browser's window. Adds `http` protocol to the URL if not present.

## Examples

```js
await openIncognitoWindow('https://google.com', { name: 'windowName' }) - Open a incognito window
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `url` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | URL to navigate page to. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
