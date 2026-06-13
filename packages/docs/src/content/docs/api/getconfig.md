---
title: "getConfig()"
description: "Lets you read the global configurations."
---

Lets you read the global configurations.

## Examples

```js
getConfig("retryInterval");
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `optionName` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Specifies the name of the configuration option/parameter you want to get (optional).<br>If not specified, returns a shallow copy of the full global configuration. |
| `string` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | "navigationTimeout" Navigation timeout value in milliseconds for navigation after performing<br>[goto](/api/goto), [click](/api/click), [doubleClick](/api/doubleclick), [rightClick](/api/rightclick),<br>[write](/api/write), [clear](/api/clear), [press](/api/press) and [evaluate](/api/evaluate). |
| `string` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | "observeTime" Option to modify delay time in milliseconds for observe mode. |
| `string` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | "retryInterval" Option to modify delay time in milliseconds to retry the search of element existence. |
| `string` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | "retryTimeout" Option to modify timeout in milliseconds while retrying the search of element existence. |
| `string` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | "observe" Option to run each command after a delay. Useful to observe what is happening in the browser. |
| `string` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | "waitForNavigation" Wait for navigation after performing [goto](/api/goto), [click](/api/click),<br>[doubleClick](/api/doubleclick), [rightClick](/api/rightclick), [write](/api/write), [clear](/api/clear),<br>[press](/api/press) and [evaluate](/api/evaluate). |
| `string` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | "ignoreSSLErrors" Option to ignore SSL errors encountered by the browser (defaults to true). |
| `string` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | "headful" Option to open browser in headless/headful mode. |
| `string` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | "highlightOnAction" Option to highlight an element on action. |

## Returns

This API does not return any values.
