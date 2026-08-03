---
title: "intercept()"
description: "Add interceptor for the network call. Helps in overriding request or to mock response of a network call."
---

Add interceptor for the network call. Helps in overriding request or to mock response of a network call.

## Examples

```js
# Case 1: Block a specific URL
await intercept(url)
```

```js
# Case 2: Mock a response
await intercept(url, {mockObject})
```

```js
# Case 3: Override request
await intercept(url, (request) => {request.continue({overrideObject})})
```

```js
# Case 4: Redirect always
await intercept(url, redirectUrl)
```

```js
# Case 5: Mock response based on a request
await intercept(url, (request) => { request.respond({mockResponseObject}) })
```

```js
# Case 6: Block URL twice
await intercept(url, undefined, 2)
```

```js
# Case 7: Mock the response only 3 times
await intercept(url, {mockObject}, 3)
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `requestUrl` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | request URL to intercept |
| `option` | [function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function) \| [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | action to be done after interception. For more examples refer to [https://github.com/getgauge/taiko/issues/98#issuecomment-42024186](https://github.com/getgauge/taiko/issues/98#issuecomment-42024186) |
| `count` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | number of times the request has to be intercepted . Optional parameter |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
