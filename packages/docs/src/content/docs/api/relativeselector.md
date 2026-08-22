---
title: "relativeSelector()"
description: "Lets you perform relative HTML element searches."
---

Lets you perform relative HTML element searches.

## Examples

```js
near('Home')
```

```js
toLeftOf('Sign in')
```

```js
toRightOf('Get Started')
```

```js
above('Sign in')
```

```js
below('Home')
```

```js
link('Sign In',near("Home"),toLeftOf("Sign Out")) - Multiple selectors can be used to perform relative search
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `selector` | [selector](/api/selector/) \| [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Web element selector. |

## Returns

| Type | Description |
| --- | --- |
| [RelativeSearchElement](/api/relativesearchelement/) | . |
