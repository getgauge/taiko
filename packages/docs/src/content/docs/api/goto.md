---
title: "goto()"
description: "Opens the specified URL in the browser's tab. Adds `http` protocol to the URL if not present."
---

Opens the specified URL in the browser's tab. Adds `http` protocol to the URL if not present.

## Examples

```js
await goto('https://google.com')
```

```js
await goto('google.com')
```

```js
await goto('example.com',{ navigationTimeout:10000, headers:{'Authorization':'Basic cG9zdG1hbjpwYXNzd29y2A=='}})
```

```js
const response = await goto('gauge.org'); if(response.status.code === 200) {console.log("Success!!")}
response: {
redirectedResponse: [
 {
   url: 'http://gauge.org/',
   status: { code: 307, text: 'Internal Redirect' }
 }
],
url: 'https://gauge.org/',
status: { code: 200, text: '' }
}
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `url` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | URL to navigate page to. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{navigationTimeout:defaultConfig.navigationTimeout}`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)> | response |
