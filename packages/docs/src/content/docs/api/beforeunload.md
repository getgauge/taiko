---
title: "beforeunload()"
description: "Accept or dismiss a `beforeunload` popup.<br>"
---

Accept or dismiss a `beforeunload` popup.<br>

## Examples

```js
beforeunload(async () => await accept())
```

```js
beforeunload(async () => await dismiss())

// Note: Taiko's `beforeunload` listener can be setup anywhere in the
// script. The listener will run when the popup displays on the page.
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `callback` | [function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function) | Action to perform. Accept/Dismiss. |

## Returns

This API does not return any values.
