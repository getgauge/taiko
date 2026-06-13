---
title: "RadioButtonWrapper class"
description: "Behaves the same as ElementWrapper + select()/deselect()/isSelected(). Represents HTML [Input Radio](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio) tag."
---

Behaves the same as ElementWrapper + select()/deselect()/isSelected().
Represents HTML [Input Radio](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio) tag.

Extends [ElementWrapper](/api/elementwrapper/).

## Instance Members

### isSelected

Check if radioButton is selected.

#### Examples

```js
await radioButton('Vehicle').isSelected()
```

#### Parameters

This API does not have any parameters.

#### Returns

| Type | Description |
| --- | --- |
| [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | true if selected, else false |

### select

Select the radioButton.

#### Examples

```js
await radioButton('Vehicle').select()
```

#### Parameters

This API does not have any parameters.

#### Returns

This API does not return any values.

### deselect

Reset the radioButton.

#### Examples

```js
await radioButton('Vehicle').deselect()
```

#### Parameters

This API does not have any parameters.

#### Returns

This API does not return any values.

### elements

Overrides [ElementWrapper#elements](/api/elementwrapper#elements/), but for RadioButton elements.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `retryInterval` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Interval in milliseconds (defaults to global settings). |
| `retryTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Timeout in milliseconds (defaults to global settings). |

#### Returns

| Type | Description |
| --- | --- |
| [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<[RadioButton](/api/radiobutton/)> | Array of all radioButtons matching the selector. |

