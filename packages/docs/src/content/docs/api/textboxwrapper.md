---
title: "TextBoxWrapper class"
description: "Behaves the same as ValueWrapper."
---

Behaves the same as ValueWrapper.

Extends [ValueWrapper](/api/valuewrapper/).

## Instance Members

### elements

Overrides `ValueWrapper#elements`, but for TextBox elements.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `retryInterval` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Interval in milliseconds (defaults to global settings). |
| `retryTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Timeout in milliseconds (defaults to global settings). |

#### Returns

| Type | Description |
| --- | --- |
| [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<[TextBox](/api/textbox/)> | Array of all textBoxes matching the selector. |
