---
title: "doubleClick()"
description: "Fetches an element with the given selector, scrolls it into view if needed, and then double clicks the element. If there's no element matching selector, the method throws an error."
---

Fetches an element with the given selector, scrolls it into view if needed, and then double clicks the element. If there's no element matching selector, the method throws an error.

## Examples

```js
await doubleClick('Get Started')
```

```js
await doubleClick(button('Get Started'))
```

```js
await doubleClick('Get Started', { waitForNavigation: true,  force: true })
```

```js
await doubleClick('Get Started', { waitForNavigation: false }, below('text'))
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `selector` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | A selector to search for element to click. If there are multiple elements satisfying the selector, the first will be double clicked. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |
| `args` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Proximity selectors |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
