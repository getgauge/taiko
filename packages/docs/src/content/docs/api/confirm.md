---
title: "confirm()"
description: "Accept or dismiss a `confirm` popup matching a text.<br>"
---

Accept or dismiss a `confirm` popup matching a text.<br>

## Examples

```js
confirm('Message', async () => await accept())

confirm('Message', async () => await dismiss())

// If alert message is unknown, A RegExp which matches
// the text can be used

confirm(/^Are.+$sure, async () => await accept())

// If alert message is completely unknown, A callback can
// be passed directly, it will get the message, defaultPrompt etc
// as arguments which can be used to make a decision.

confirm(async ({message,defaultPrompt}) => {
 if(message === "Continue?") {
   await accept();
 }else{
   await dismiss();
 }
})

// Note: Taiko's `confirm` listener has to be setup before the confirm
// popup displays on the page. For example, if clicking on a button
// shows the confirm popup, the Taiko script is

confirm('Message', async () => await accept())
await click('Show Confirm')
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `message` | `unknown` |  |
| `callback` | [function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function) | Action to perform. accept/dismiss. |
| `messageOrCallback` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [RegExp](/api/regexp/) \| [function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function) | Identify alert based on this message, regex or callback. |

## Returns

This API does not return any values.
