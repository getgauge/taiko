---
title: "click()"
description: "Fetches an element with the given selector, scrolls it into view if needed, and then clicks in the center of the element. If there's no element matching selector, the method throws an error."
---

Fetches an element with the given selector, scrolls it into view if needed, and then clicks in the center of the element. If there's no element matching selector, the method throws an error.

## Examples

```js
await click('Get Started')
```

```js
await click(link('Get Started'))
```

```js
await click({x : 170, y : 567})
```

```js
await click('Get Started', { navigationTimeout: 60000,  force: true })
```

```js
await click('Get Started', { navigationTimeout: 60000 }, below('text'))
```

```js
await click('Get Started', { navigationTimeout: 60000, position: 'right' }, below('text'))
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `selector` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | A selector to search for element to click / coordinates of the elemets to click on. If there are multiple elements satisfying the selector, the first will be clicked. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |
| `args` | [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array) | Proximity selectors |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
