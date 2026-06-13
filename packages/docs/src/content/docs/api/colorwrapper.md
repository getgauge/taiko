---
title: "ColorWrapper class"
description: "Behaves the same as ValueWrapper + select(). Represents HTML [Input Color](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color)"
---

Behaves the same as ValueWrapper + select().
Represents HTML [Input Color](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color)

Extends [ValueWrapper](/api/valuewrapper/).

## Instance Members

### elements

Overrides [ElementWrapper#elements](/api/elementwrapper/#elements), but for Color elements.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `retryInterval` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Interval in milliseconds (defaults to global settings). |
| `retryTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Timeout in milliseconds (defaults to global settings). |

#### Returns

| Type | Description |
| --- | --- |
| [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<[Color](/api/color/)> | Array of all elements matching the selector. |
