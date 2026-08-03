---
title: "to()"
description: "This function is used to improve the readability. It simply returns the parameter passed into it."
---

This function is used to improve the readability. It simply returns the parameter passed into it.

## Examples

```js
await attach('c:/abc.txt', to('Please select a file:'))
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |
| `selector` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Web element selector. |

## Returns

| Type | Description |
| --- | --- |
| [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | selector - Web element selector. |
