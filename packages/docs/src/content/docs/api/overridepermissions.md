---
title: "overridePermissions()"
description: "Override specific permissions to the given origin"
---

Override specific permissions to the given origin

## Examples

```js
await overridePermissions('http://maps.google.com',['geolocation']);
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `origin` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | url origin to override permissions |
| `permissions` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | See [chrome devtools permission types](https://chromedevtools.github.io/devtools-protocol/tot/Browser/#type-PermissionType) for a list of permission types. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
