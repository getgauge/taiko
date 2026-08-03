---
title: "emulateTimezone()"
description: "Changes the timezone of the page. See [`metaZones.txt`](https://cs.chromium.org/chromium/src/third_party/icu/source/data/misc/metaZones.txt?rcl=faee8bc70570192d82d2978a71e2a615788597d1) for a list of supported timezone IDs."
---

Changes the timezone of the page. See [`metaZones.txt`](https://cs.chromium.org/chromium/src/third_party/icu/source/data/misc/metaZones.txt?rcl=faee8bc70570192d82d2978a71e2a615788597d1)
for a list of supported timezone IDs.

## Examples

```js
await emulateTimezone('America/Jamaica')
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `timezoneId` | `unknown` |  |

## Returns

This API does not return any values.
