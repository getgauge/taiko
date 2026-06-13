---
title: "waitFor()"
description: "This function is used to wait for number of milliseconds given or a given element or a given condition."
---

This function is used to wait for number of milliseconds given or a given element or a given condition.

## Examples

```js
waitFor(5000)
```

```js
waitFor("1 item in cart")
```

```js
waitFor("Order Created", 2000)
```

```js
waitFor(async () => !(await $("loading-text").exists()))
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `element` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Element/condition to wait for |
| `time` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) \| [time](/api/time/) | Time to wait. default to 10s |
| `options` | `unknown` |  Default: `{}`. |
| `null-null` | [options.message](/api/options.message/) | Custom message |

## Returns

| Type | Description |
| --- | --- |
| [promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise) |  |
