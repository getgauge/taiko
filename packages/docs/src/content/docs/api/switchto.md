---
title: "switchTo()"
description: "Allows switching between tabs and windows using URL or page title or Window name."
---

Allows switching between tabs and windows using URL or page title or Window name.

## Examples

```js
# Switch using URL
await switchTo(/taiko.dev/)
```

```js
# Switch using Title
await switchTo(/Taiko/)
```

```js
# Switch using Regex URL
await switchTo(/http(s?):\/\/(www?).google.(com|co.in|co.uk)/)
```

```js
# Switch using wild cards in the Regex
await switchTo(/Go*gle/)
```

```js
# Switch to a window identifier
await openBrowser();
await goto('google.com');
openIncognitoWindow({ name: "newyorktimes"});
switchTo(/google.com/);
switchTo({ name: "newyorktimes"});
```

```js
openTab('https://taiko.dev', {name: 'taiko'})
openIncognitoWindow({ name: "newyorktimes"});
switchTo({name: 'taiko'});
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `arg` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | Regex (Regular expression) the tab's title/URL or `Object` with<br>window name for example `{ name: "windowname"}` |

## Returns

| Type | Description |
| --- | --- |
| [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<`void`> |  |
