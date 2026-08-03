---
title: "attach()"
description: "Attaches a file to a file input element."
---

Attaches a file to a file input element.

## Examples

```js
await attach('c:/abc.txt', to('Please select a file:'))
```

```js
await attach('c:/abc.txt', 'Please select a file:')
```

```js
await attach('c:/abc.txt', 'Please select a file:',{force:true})
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `filepath` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | or filepaths- The path or paths of the file to be attached. |
| `to` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | The file input element to which to attach the file. |
| `options` | `unknown` |  Default: `{}`. |

## Returns

This API does not return any values.
