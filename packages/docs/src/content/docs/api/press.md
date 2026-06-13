---
title: "press()"
description: "Presses the given keys."
---

Presses the given keys.

## Examples

```js
await press('Enter')
```

```js
await press('a')
```

```js
await press(['Shift', 'ArrowLeft', 'ArrowLeft'])
```

```js
awaitpress('a', { waitForNavigation: false })
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `keys` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)> | Name of keys to press. See [USKeyboardLayout](https://github.com/getgauge/taiko/blob/master/lib/data/USKeyboardLayout.js) for a list of all key names. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
