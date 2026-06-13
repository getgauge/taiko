---
title: "alert()"
description: "Accept or dismiss a `alert` matching a text.<br>"
---

Accept or dismiss a `alert` matching a text.<br>

## Examples

```js
alert('Are you sure', async () => await accept())

alert('Are you sure', async () => await dismiss())

// If alert message is unknown, A RegExp which matches
// the text can be used

alert(/^Close.*$/, async () => await accept())

// If alert message is completely unknown, A callback can
// be passed directly, it will get the message, url etc
// as arguments which can be used to make a decision.

alert(async ({message}) => {
  if(message === "Are you sure?") {
    await accept();
   }
})

// Note: Taiko's `alert` listener has to be setup before the alert
// popup displays on the page. For example, if clicking on a button
// shows the confirm popup, the Taiko script is

alert('Message', async () => await accept())
await click('Show Alert')
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `message` | `unknown` |  |
| `callback` | [function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function) | Action to perform. accept/dismiss. |
| `messageOrCallback` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [RegExp](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/RegExp) \| [function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function) | Identify prompt based on this message, regex or callback. |

## Returns

This API does not return any values.
