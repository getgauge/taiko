---
title: "closeTab()"
description: "Closes the given tab with given URL or closes current tab."
---

Closes the given tab with given URL or closes current tab.

## Examples

```js
# Closes the current tab.
await closeTab()
```

```js
# Closes all the tabs with Title 'Open Source Test Automation Framework | Gauge'.
await closeTab('Open Source Test Automation Framework | Gauge')
```

```js
# Closes all the tabs with URL 'https://gauge.org'.
await closeTab('https://gauge.org')
```

```js
# Closes all the tabs with Regex Title 'Go*gle'
await closeTab(/Go*gle/)
```

```js
# Closes all the tabs with Regex URL '/http(s?):\/\/(www?).google.(com|co.in|co.uk)/'
await closeTab(/http(s?):\/\/(www?).google.(com|co.in|co.uk)/)
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `identifier` | `unknown` |  |
| `targetUrl` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | URL/Page title of the tab to close. Default: `undefined`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
