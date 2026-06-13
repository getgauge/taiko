---
title: "FileFieldWrapper class"
description: "Behaves the same as ValueWrapper, but for FileField element. Represents HTML [Input File Field](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file)"
---

Behaves the same as ValueWrapper, but for FileField element.
Represents HTML [Input File Field](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file)

Extends [ValueWrapper](/api/valuewrapper/).

## Instance Members

### elements

Overrides [ElementWrapper#elements](/api/elementwrapper#elements/), but for FileField elements.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `retryInterval` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Interval in milliseconds (defaults to global settings). |
| `retryTimeout` | [number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number) | Retry Timeout in milliseconds (defaults to global settings). |

#### Returns

| Type | Description |
| --- | --- |
| [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<[FileField](/api/filefield/)> | Array of all elements matching the selector. |

