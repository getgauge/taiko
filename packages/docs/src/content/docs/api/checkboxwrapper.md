---
title: "CheckBoxWrapper class"
description: "Behaves the same as ElementWrapper + isChecked()/check()/uncheck(). Represents HTML [Input Checkbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox)"
---

Behaves the same as ElementWrapper + isChecked()/check()/uncheck().
Represents HTML [Input Checkbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox)

Extends [ElementWrapper](/api/elementwrapper/).

## Instance Members

### isChecked

Get state of selected checkbox.

#### Examples

```js
await checkBox('Vehicle').isChecked()
```

#### Parameters

This API does not have any parameters.

#### Returns

| Type | Description |
| --- | --- |
| [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | true if checked, else false |

### check

Set checkbox to 'checked' state.

#### Examples

```js
await checkBox('Vehicle').check()
```

#### Parameters

This API does not have any parameters.

#### Returns

This API does not return any values.

### uncheck

Clears checkbox's state, if set.

#### Examples

```js
await checkBox('Vehicle').uncheck()
```

#### Parameters

This API does not have any parameters.

#### Returns

This API does not return any values.

### elements

Overrides [ElementWrapper#elements](/api/elementwrapper/#elements), but for Checkbox elements.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `retryInterval` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Interval in milliseconds (defaults to global settings). |
| `retryTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Timeout in milliseconds (defaults to global settings). |

#### Returns

| Type | Description |
| --- | --- |
| [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<[CheckBox](/api/checkbox/)> | Array of all checkboxes matching the selector. |
