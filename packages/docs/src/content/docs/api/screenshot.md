---
title: "screenshot()"
description: "Captures a screenshot of the page. Appends timeStamp to filename if no filepath given."
---

Captures a screenshot of the page. Appends timeStamp to filename if no filepath given.

## Examples

```js
await screenshot()
```

```js
await screenshot({path : 'screenshot.png'})
```

```js
await screenshot({fullPage:true})
```

```js
await screenshot(text('Images', toRightOf('gmail')))
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `selector` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) |  |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Buffer](/api/buffer/)> | Promise which resolves to buffer with captured screenshot if `{encoding:'base64'}` given, otherwise it resolves to undefined. |
