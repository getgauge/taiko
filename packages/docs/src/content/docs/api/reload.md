---
title: "reload()"
description: "Reloads the page."
---

Reloads the page.

## Examples

```js
await reload('https://google.com')
```

```js
await reload('https://google.com', { navigationTimeout: 10000 })
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `url` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | DEPRECATED URL to reload |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{navigationTimeout:defaultConfig.navigationTimeout}`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
