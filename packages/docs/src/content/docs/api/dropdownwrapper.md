---
title: "DropDownWrapper class"
description: "Behaves the same as ValueWrapper + select(). Represents HTML [Select](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select)"
---

Behaves the same as ValueWrapper + select().
Represents HTML [Select](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select)

Extends [ValueWrapper](/api/valuewrapper/).

## Instance Members

### select

Select option or options from a drop down

#### Examples

```js
// Select multiple values based on array of values provided
await dropDown('Vehicle:').select(['Car','Van'])
```

```js
// Select multiple values based on array if indices provided
await dropDown('Vehicle:').select({index : [0,1]})
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `values` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | value(s) to be selected |

#### Returns

This API does not return any values.

### elements

Overrides [ElementWrapper#elements](/api/elementwrapper#elements/), but for DropDown elements.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `retryInterval` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Interval in milliseconds (defaults to global settings). |
| `retryTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Timeout in milliseconds (defaults to global settings). |

#### Returns

| Type | Description |
| --- | --- |
| [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<[DropDown](/api/dropdown/)> | Array of all elements matching the selector. |

