---
title: "repl()"
description: "Starts a REPL when Taiko is invoked as a runner with `--load` option."
---

Starts a REPL when Taiko is invoked as a runner with `--load` option.

## Examples

```js
const { goto } = require('taiko');
const { repl } = require('taiko/recorder');
(async () => {
await goto('google.com')
await goto('google.com')
await repl();
})();
```

```js
taiko --load script.js
```

## Parameters

This API does not have any parameters.

## Returns

This API does not return any values.
