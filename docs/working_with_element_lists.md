---
layout: page.njk
---

Taiko's selector API's matches the first element by default. 
Taiko also has API's to loop through all the matches in case 
there are more than one element that match the selector criteria.

Let's use a list as an example to understand this better

```
<ul id="fruits">
    <li class="fruit">Apple</li>
    <li class="fruit">Orange</li>
    <li class="fruit">Melon</li>
    <li class="fruit">Pear</li>
</ul>
```

This sample uses the `li` HTML tag and class attributes to render a list of fruits. 
You can use Taiko's [`listItem`](https://docs.taiko.dev/api/listitem/)
API to select a specific item from this list

```
// Returns true
await listItem('Apple').exists(); 

 // Returns false (after default wait)
await listItem('Mango').exists();   
```

In some cases you might want to fetch the value from the list to
use as data or use your own assertion library. You can do this as follows

```
// Returns Apple
await listItem({class: "fruit"}).text(); 
```

Notice that the method `text()` returns the text of the first match for the `listitem` 
with the class attribute `fruit` even though there are more matches.
The following sections explains how you can access all the matches in the list.

## Using indexes and loops

To access other matches of the list items with the class attribute `fruit` 
you can use the [`elements`](https://docs.taiko.dev/api/elementwrapper/#elements) 
in two ways.

By passing the index of the match you want to fetch

```
var fruit = await listItem({class: "fruit"}).element(0); 

// Prints Apple
console.log(fruit);
```

```
var fruit = await listItem({class: "fruit"}).element(3); 

// Prints Pear
console.log(fruit);
```

or by looping through all matches in the elements array using a `for` loop 

```
/* Prints
Apple
Orange
Melon
Pear
*/

var fruits = await listItem({class: "fruit"}).elements(); 

for (fruit of fruits) {
    console.log(await fruit.text());
}

```

The `elements` method is also available for CSS and XPath selectors

```
var fruits = await $('.fruit').elements(); 
```

```
var fruits = await $("//li[@class='fruit']").elements(); 
```

Please note

* The match indexes are [Zero-based](https://en.wikipedia.org/wiki/Zero-based_numbering)
* You cannot use callback methods on the list like `forEach(...)` as they are not async aware.

## Using index based selectors

To directly fetch the nth element, use indexes in your CSS and XPath
selectors

```
//Returns Orange
var fruit = await $(".fruit:nth-child(2)").text(); 
```

```
//Returns Melon
var fruit = await $("//li[@class='fruit'][3]").text();
```

Please note, the indexes here are One-based.