---
title: "setConfig()"
description: "Lets you configure global configurations."
---

Lets you configure global configurations.

## Examples

```js
setConfig( { observeTime: 3000});
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  |
| `options.navigationTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Navigation timeout value in milliseconds for navigation after performing<br><a href="#opentab">openTab</a>, <a href="#goto">goto</a>, <a href="#reload">reload</a>, <a href="#goback">goBack</a>,<br><a href="#goforward">goForward</a>, <a href="#click">click</a>, <a href="#write">write</a>, <a href="#clear">clear</a>,<br><a href="#press">press</a> and <a href="#evaluate">evaluate</a>. Default: `30000`. |
| `options.observeTime` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Option to modify delay time in milliseconds for observe mode. Default: `3000`. |
| `options.retryInterval` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Option to modify delay time in milliseconds to retry the search of element existence. Default: `100`. |
| `options.retryTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Option to modify timeout in milliseconds while retrying the search of element existence. Default: `10000`. |
| `options.observe` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Option to run each command after a delay. Useful to observe what is happening in the browser. Default: `false`. |
| `options.waitForNavigation` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Wait for navigation after performing <a href="#goto">goto</a>, <a href="#click">click</a>,<br><a href="#doubleclick">doubleClick</a>, <a href="#rightclick">rightClick</a>, <a href="#write">write</a>, <a href="#clear">clear</a>,<br><a href="#press">press</a> and <a href="#evaluate">evaluate</a>. Default: `true`. |
| `options.waitForEvents` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Wait for events after performing <a href="#goto">goto</a>, <a href="#click">click</a>,<br><a href="#doubleclick">doubleClick</a>, <a href="#rightclick">rightClick</a>, <a href="#write">write</a>, <a href="#clear">clear</a>,<br><a href="#press">press</a> and <a href="#evaluate">evaluate</a>. Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle',<br>'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint', 'targetNavigated'] Default: `[]`. |
| `options.ignoreSSLErrors` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Option to ignore SSL errors encountered by the browser. Default: `true`. |
| `options.headful` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Option to open browser in headless/headful mode. Default: `false`. |
| `options.highlightOnAction` | [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | Option to highlight an element on action. Default: `false`. |

## Returns

This API does not return any values.
