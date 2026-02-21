---
layout: page.njk
---

Taiko's API uses Chrome Devtools Protocol to automate
the browser. Taiko commands run outside the browser as 
Node js script. This is different from other tools like 
Cypress that run commands inside the browser. In rare cases, 
you might want run commands inside the browser or perform actions
not available on Taiko's API. The following sections show 
how to use Taiko's [`evaluate`](/api/evaluate) API to run 
JavaScript commands in the browser.

## Read elements and it's attributes

The `evaluate` API can access the DOM of the page 
you are testing to read or modify elements for example in 
the following HTML

    <div id="data" 
        data-text="some metadata"
        class="box">Lorem ipsum</div>

Although there's no core Taiko API to read data attributes like
`data-text`, Taiko's `evaluate` API can run the following script in the 
browser to read the value.

    var text = await evaluate($("#data"), 
        (element) => element.dataset.text);

    console.log(text); // Prints "some metadata"

Please note that `element.dataset.text` runs in the context
of the page, it is plain JavaScript in the browser. You cannot 
access Taiko's API within `evaluate`.

You can also use `evaluate` to read other attributes or content

    var attribute = await evaluate($("#data"), 
        (element) => element.getAttribute("class"));

    console.log(attribute); // Prints "box"

    var content = await evaluate($("#data"), 
        (element) => element.innerText);

    console.log(attribute); // Prints "box"

## Perform actions on the page

Taiko's API is extensive enough to cover major testing 
scenarios. If there's no direct API to access an 
element or perform an action on an element in the page you can use 
`Document.querySelector()` or pass a selector to `evaluate`
and perform these actions directly on the page.

For the sake of simplicity let's click the following button 

    <input type="button" id="hidden" value="Click"/>

You can use `evaluate` for clicking as follows

    await evaluate($("#hidden"), (element) => element.click());
    await evaluate(() => document.getElementById('hidden').click());

As mentioned earlier, the scripts in `evaluate` uses the page's DOM. 
For more reference please check [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document)

## Injecting or calling JavaScript functions

You can also use the `evaluate` method to inject 
Javascript functions on your page for example let's 
assume there's a call to a function `foo` on you page.

    <input type="button" onclick="foo()" value="Foo click"/>

You can have Taiko define or override the function using `evaluate` as
follows.

    await evaluate(function() { 
        window.foo = () => { console.log('bar')}
    });

    await click("Foo click"); // Prints 'bar' in the Browser's console

Please note the scope/availability of the injected 
JavaScript function is dependent on the order of injection 
and the page scope, which means that if the page is refreshed or another 
page is loaded the script must be injected again. If you are 
testing Single Page applications you probably don't need inject the scripts again
as the page scope usually remains the same.

You an also invoke the web applications JavaScript methods

    <script>
        function foo() {
            return 'bar';
        }
    </script>

Invoke `foo` using `evaluate` as follows

    var result = await evaluate(function() { return foo() });
    console.log(result) // Prints 'bar' on Taiko's console

## Passing data

The `evaluate` function can return values for example

    var title = await evaluate(() => { return document.title });

Here `document.title` is a string type. The following is an example
that returns a JSON Object

    var result = await evaluate(() => { return { title: "Page 1" } });
    console.log(result.title) // Prints "Page 1"

You cannot return HTML elements. `evaluate` must return only serializable 
data.

`evaluate` also has an option to receive data from Taiko scripts as follows

    var message = { args: { greeting: "Hello" } };
      
    var content = await evaluate($("#data"), (element, args) => { 
        element.innerText = args.greeting;
    }, message);

