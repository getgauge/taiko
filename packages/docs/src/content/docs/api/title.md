---
title: "title()"
description: "Returns page's title."
---

Returns page's title.

## Examples

```js
await openBrowser();
```

```js
await goto("www.google.com");
```

```js
await title(); # returns "Google"
```

## Parameters

This API does not have any parameters.

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)> | The title of the current page. |
