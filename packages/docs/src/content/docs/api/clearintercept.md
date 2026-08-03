---
title: "clearIntercept()"
description: "Removes interceptor for the provided URL or all interceptors if no URL is specified"
---

Removes interceptor for the provided URL or all interceptors if no URL is specified

## Examples

```js
# case 1: Remove intercept for a single  URL :
await clearIntercept(requestUrl)
# case 2: Reset intercept for all URL :
await clearIntercept()
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `requestUrl` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | request URL to intercept. Optional parameters |

## Returns

This API does not return any values.
