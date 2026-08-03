---
title: "prompt()"
description: "Accept or dismiss a `prompt` matching a text.<br> Write into the `prompt` with `accept('Something')`."
---

Accept or dismiss a `prompt` matching a text.<br>
Write into the `prompt` with `accept('Something')`.

## Examples

```js
prompt('Message', async () => await accept('something'))

prompt('Message', async () => await dismiss())

// If prompt message is unknown, A RegExp which matches
// the text can be used

prompt(/^Please.+$name/, async () => await accept("NAME"))

// If prompt message is completely unknown, A callback can
// be passed directly, it will get the message, defaultPrompt etc
// as arguments which can be used to make a decision.

prompt(async ({message}) => {
  if(message === "Please enter your age?") {
    await accept('20')
   }
})

// Note: Taiko's `prompt` listener has to be setup before the promt
// popup displays on the page. For example, if clicking on a button
// shows the prompt popup, the Taiko script is

prompt('Message', async () => await accept())
await click('Open Prompt')
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `message` | `unknown` |  |
| `callback` | [function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function) | Action to perform. accept/dismiss. |
| `messageOrCallback` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [RegExp](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/RegExp) \| [function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function) | Identify prompt based on this message, regex or callback. |

## Returns

This API does not return any values.
