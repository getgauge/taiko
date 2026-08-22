---
title: "accept()"
description: "Accept action to perform on dialogs"
---

Accept action to perform on dialogs

## Examples

```js
prompt('Message', async () => await accept('Something'))
```

```js
prompt('Message', async () => await accept())
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `text` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Expected text of the dialog (optional) Default: `""`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> | Resolves when dialog is accepted |
