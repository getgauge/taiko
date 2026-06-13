---
title: "write()"
description: "Types the given text into the focused or given element."
---

Types the given text into the focused or given element.

## Examples

```js
await write('admin')
```

```js
await write('admin', into(textBox("Username"),{force:true})
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `text` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Text to type into the element. |
| `into` | [selector](/api/selector/) \| [Element](/api/element/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | A selector of an element to write into. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{delay:0}`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
