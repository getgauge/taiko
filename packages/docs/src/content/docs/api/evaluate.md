---
title: "evaluate()"
description: "Evaluates script on element matching the given selector."
---

Evaluates script on element matching the given selector.

## Examples

```js
await evaluate(link("something"), (element) => element.style.backgroundColor)
```

```js
await evaluate((element) => {
     element.style.backgroundColor = 'red';
})
```

```js
await evaluate(() => {
  // Callback function have access to all DOM APIs available in the developer console.
  return document.title;
} )
```

```js
let options = { args: [ '.main-content', {backgroundColor:'red'}]}

await evaluate(link("something"), (element, args) => {
     element.style.backgroundColor = args[1].backgroundColor;
     element.querySelector(args[0]).innerText = 'Some thing';
}, options)
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `selector` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Web element selector. |
| `callback` | [function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function) | callback method to execute on the element or root HTML element when selector is not provided.<br><br>NOTE : In callback, we can access only inline css not the one which are define in css files. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | options. Default: `{}`. |
| `options.waitForNavigation` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Wait for navigation after the click. Default navigation timeout is 15 seconds, to override pass `{ navigationTimeout: 10000 }` in `options` parameter. Default: `true`. |
| `options.waitForStart` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | wait for navigation to start. Accepts value in milliseconds. Default: `100`. |
| `options.navigationTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Navigation timeout value in milliseconds for navigation after click. Default: `5000`. |
| `options.args` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Arguments to be passed to the provided callback. |
| `options.waitForEvents` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated'] Default: `[]`. |
| `options.silent` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Set true to run script silently without printing messages. Default: `false`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)> | Object with return value of callback given. |
