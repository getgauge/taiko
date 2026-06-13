---
title: "RangeWrapper class"
description: "Behaves the same as ValueWrapper + select(), for [Range](/api/range/) element. Represents HTML [Input Range](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range)"
---

Behaves the same as ValueWrapper + select(), for [Range](/api/range/) element.
Represents HTML [Input Range](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range)

Extends [ValueWrapper](/api/valuewrapper/).

## Instance Members

### select

Select the given value in the range.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `value` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | accepts float values |

#### Returns

This API does not return any values.

### elements

Overrides [ValueWrapper#elements](/api/valuewrapper#elements/), but for Range elements.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `retryInterval` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Interval in milliseconds (defaults to global settings). |
| `retryTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Timeout in milliseconds (defaults to global settings). |

#### Returns

| Type | Description |
| --- | --- |
| [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<[Range](/api/range/)> | Array of all range matching the selector. |

