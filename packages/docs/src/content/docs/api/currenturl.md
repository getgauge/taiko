---
title: "currentURL()"
description: "Returns window's current URL."
---

Returns window's current URL.

## Examples

```js
await openBrowser();
```

```js
await goto("www.google.com");
```

```js
await currentURL(); # returns "https://www.google.com/?gws_rd=ssl"
```

## Parameters

This API does not have any parameters.

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)> | The URL of the current window. |
