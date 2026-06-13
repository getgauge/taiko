---
title: "ElementWrapper class"
description: "Wrapper object of all found elements. This list mimics the behaviour of [Element](https://developer.mozilla.org/docs/Web/API/Element) by exposing similar methods. The call of these methods gets delegated to first element. By default, the `ElementWrapper` acts as a proxy to the first matching element and hence it forwards function calls that belong to [Element](https://developer.mozilla.org/docs/Web/API/Element)"
---

Wrapper object of all found elements. This list mimics the behaviour of [Element](https://developer.mozilla.org/docs/Web/API/Element)
by exposing similar methods. The call of these methods gets delegated to first element.
By default, the `ElementWrapper` acts as a proxy to the first matching element and hence
it forwards function calls that belong to [Element](https://developer.mozilla.org/docs/Web/API/Element)

## Instance Members

### get

API documentation for get.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `retryInterval` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Interval in milliseconds (defaults to global settings). |
| `retryTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Timeout in milliseconds (defaults to global settings). |

#### Returns

| Type | Description |
| --- | --- |
| [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<[Element](https://developer.mozilla.org/docs/Web/API/Element)> | All elements mathing the selector. |

### description

Describes the operation performed. The description is the same that is printed when performing the operation in REPL.

#### Examples

```js
link('google').description // prints "'Link with text google'"
```

#### Parameters

This API does not have any parameters.

#### Returns

| Type | Description |
| --- | --- |
| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Description of the current command that fetched this element(wrapper). |

### exists

Checks existence for element. `exists()` waits for `retryTimeout` before deciding that the page is loaded.
(NOTE: `exists()` returns boolean from version `0.4.0`)

#### Examples

```js
// To 'short-circuit' non existence. However this should be done only if there is no network calls/reloads.
element.exists(0,0)
```

```js
link('google').exists()
```

```js
link('google').exists(1000)
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `retryInterval` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Interval in milliseconds (defaults to global settings). |
| `retryTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Timeout in milliseconds (defaults to global settings). |

#### Returns

| Type | Description |
| --- | --- |
| [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | true if exists, else false. |

### text

Gets the [`innerText`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText) of the element

#### Parameters

This API does not have any parameters.

#### Returns

| Type | Description |
| --- | --- |
| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | [`innerText`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText) of the element |

### isVisible

Checks if element is visually visible. `isVisible()` is false when the element is overshadowed by another element,
or if the element is outside the viewport.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `retryInterval` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Interval in milliseconds (defaults to global settings). |
| `retryTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Timeout in milliseconds (defaults to global settings). |

#### Returns

| Type | Description |
| --- | --- |
| [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | true if visible, else false. |

### isDisabled

Checks if element is disabled

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `retryInterval` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Interval in milliseconds (defaults to global settings). |
| `retryTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Timeout in milliseconds (defaults to global settings). |

#### Returns

| Type | Description |
| --- | --- |
| [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | true if disabled, else false. |

### isDraggable

Checks if element is [draggable](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/draggable).

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `retryInterval` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Interval in milliseconds (defaults to global settings). |
| `retryTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Timeout in milliseconds (defaults to global settings). |

#### Returns

| Type | Description |
| --- | --- |
| [boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | true if disabled, else false. |

### attribute

Read attribute value of the element found.

#### Examples

```js
link('google').attribute('alt')
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `name` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) |  |

#### Returns

| Type | Description |
| --- | --- |
| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | value of attribute |

### elements

DOM element getter. Implicitly wait for the element to appears with timeout of 10 seconds.

#### Examples

```js
// To loop over all the elements
let elements = await $('a').elements();
for (element of elements) {
   console.log(await element.text());
}
```

```js
textBox('username').value()
(await textBox('username').elements())[0].value() # same as above
```

```js
$('.class').text()
(await $('.class').elements())[0].text() # same as above
```

```js
let element = await $('a').element(0);
console.log(await element.text());
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `retryInterval` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Interval in milliseconds (defaults to global settings). |
| `retryTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Timeout in milliseconds (defaults to global settings). |

#### Returns

| Type | Description |
| --- | --- |
| [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<[Element](https://developer.mozilla.org/docs/Web/API/Element)> | Array of all elements matching the selector. |

### element

DOM element getter. Implicitly wait for the element to appears with timeout of 10 seconds.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `index` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Zero-based index of element to return |
| `retryInterval` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Interval in milliseconds (defaults to global settings). |
| `retryTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Timeout in milliseconds (defaults to global settings). |

#### Returns

| Type | Description |
| --- | --- |
| [Element](https://developer.mozilla.org/docs/Web/API/Element) | First element that matches the selector. |
