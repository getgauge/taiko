---
title: "tableCell()"
description: "This [selector](/api/selector/) lets you identify a table cell on a web page with row and column and row values as options and locating table using proximity selectors, or table labels."
---

This [selector](/api/selector/) lets you identify a table cell
on a web page with row and column and row values as options and locating table using proximity selectors,
or table labels.

## Examples

```js
tableCell({row:1, col:1}, "Table Caption")
```

```js
tableCell({id:'myColumn'}).text()
```

```js
tableCell({row:1,col:3}).text()
```

```js
highlight(tableCell({row:2, col:3}, "Table Caption"))
```

```js
highlight(text("Table Cell 2",above(tableCell({row:2, col:2}, "Table Caption"))))
```

```js
highlight(text("Table Cell 1",near(tableCell({row:1, col:1}, "Table Caption"))))
```

```js
click(link(above(tableCell({row:4,col:1},"Table Caption"))))
```

```js
highlight(link(above(tableCell({row:4,col:1},above("Code")))))
```

## Parameters

| Name | Type | Description |
| --- | --- | --- |
| `options` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | Pair of row and column like {row:1, col:3} |
| `attrValuePairs` | [Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object) | Pairs of attribute and value like {"id":"name","class":"class-name"} |
| `label` | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | The Table Caption or any Table Header or Table ID. |
| `args` | [relativeSelector](/api/relativeselector/) | Proximity selectors |

## Returns

| Type | Description |
| --- | --- |
| [TableCellWrapper](/api/tablecellwrapper/) | -  |
