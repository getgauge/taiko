---
title: "emulateDevice()"
description: "Overrides the values of device screen dimensions according to a predefined list of devices. To provide custom device dimensions, use setViewPort API."
---

Overrides the values of device screen dimensions according to a predefined list of devices. To provide custom device dimensions, use setViewPort API.

## Examples

```js
await emulateDevice('iPhone 6')
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `deviceModel` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | See [device model](https://docs.taiko.dev/devices) for a list of all device models. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
