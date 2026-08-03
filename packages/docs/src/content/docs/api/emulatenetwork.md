---
title: "emulateNetwork()"
description: "Activates emulation of network conditions."
---

Activates emulation of network conditions.

## Examples

```js
# Emulate offline conditions
await emulateNetwork("Offline")
```

```js
# Emulate slow network conditions
await emulateNetwork("Good2G")
```

```js
# Emulate precise network conditions
await emulateNetwork({ offline: false, downloadThroughput: 6400, uploadThroughput: 2560, latency: 500 })
```

```js
# Emulate precise network conditions with any subset of these properties, with default fallbacks of `offline` as true and all numbers as 0
await emulateNetwork({ downloadThroughput: 6400, uploadThroughput: 2560, latency: 500 })
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `networkType` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | 'GPRS','Regular2G','Good2G','Good3G','Regular3G','Regular4G','DSL','WiFi','Offline', {offline: boolean, downloadThroughput: number, uploadThroughput: number, latency: number} |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
