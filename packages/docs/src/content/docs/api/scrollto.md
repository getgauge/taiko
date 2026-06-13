---
title: "scrollTo()"
description: "Scrolls the page to the given element. The alignment parameters can be overridden, see below. A reference of the possible values for the alignment parameters is available at [https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView)."
---

Scrolls the page to the given element.
The alignment parameters can be overridden, see below.
A reference of the possible values for the alignment parameters is available at [https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView).

## Examples

```js
await scrollTo('Get Started')
```

```js
await scrollTo(link('Get Started'))
```

```js
await scrollTo('Get Started', { blockAlignment: 'center', inlineAlignment: 'center' })
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `selector` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | A selector of an element to scroll to. |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) |  Default: `{}`. |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
