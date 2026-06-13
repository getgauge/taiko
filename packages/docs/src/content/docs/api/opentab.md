---
title: "openTab()"
description: "Launches a new tab. If url is provided, the new tab is opened with the url loaded."
---

Launches a new tab. If url is provided, the new tab is opened with the url loaded.

## Examples

```js
await openTab('https://taiko.dev')
```

```js
await openTab() # opens a blank tab.
```

```js
await openTab('https://taiko.dev', {name: 'taiko'}) # Tab with identifier
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `targetUrl` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Url of page to open in newly created tab. Default: `undefined`. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
