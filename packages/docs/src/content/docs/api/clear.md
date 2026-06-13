---
title: "clear()"
description: "Clears the value of given selector. If no selector is given clears the current active element."
---

Clears the value of given selector. If no selector is given clears the current active element.

## Examples

```js
await clear()
```

```js
await clear(textBox({placeholder:'Email'}))
```

```js
await clear(textBox({ placeholder: 'Email' }), { waitForNavigation: true, force: true })
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `selector` | [selector](/api/selector/) | A selector to search for element to clear. If there are multiple elements satisfying the selector, the first will be cleared. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | Click options. Default: `{}`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
