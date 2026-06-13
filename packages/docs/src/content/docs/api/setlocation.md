---
title: "setLocation()"
description: "Overrides the Geolocation Position"
---

Overrides the Geolocation Position

## Examples

```js
await setLocation({ latitude: 27.1752868, longitude: 78.040009, accuracy:20 })
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | Latitude, longitude and accuracy to set the location. |
| `options.latitude` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Mock latitude |
| `options.longitude` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Mock longitude |
| `options.accuracy` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Mock accuracy |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
