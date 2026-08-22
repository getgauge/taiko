---
title: "TimeFieldWrapper class"
description: "Behaves the same as ValueWrapper + select(). Represents HTML Time Input. Supported elements: - [`input[type=\"date\" i]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date) - [`input[type=\"datetime-local\" i]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local) - [`input[type=\"month\" i]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/month) - [`input[type=\"time\" i]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/time) - [`input[type=\"week\" i]'`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/week)"
---

Behaves the same as ValueWrapper + select().
Represents HTML Time Input. Supported elements:

- [`input[type="date" i]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date)
- [`input[type="datetime-local" i]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local)
- [`input[type="month" i]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/month)
- [`input[type="time" i]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/time)
- [`input[type="week" i]'`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/week)

Extends [ValueWrapper](/api/valuewrapper/).

## Instance Members

### select

Select the given date.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `value` | [Date](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date) |  |

#### Returns

This API does not return any values.

### elements

Overrides `ValueWrapper#elements`, but for [TimeField](/api/timefield/) elements.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `retryInterval` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Interval in milliseconds (defaults to global settings). |
| `retryTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Timeout in milliseconds (defaults to global settings). |

#### Returns

| Type | Description |
| --- | --- |
| [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<[TimeField](/api/timefield/)> | Array of all timeFields matching the selector. |
