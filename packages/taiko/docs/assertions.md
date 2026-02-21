---
layout: page.njk
---

In the following sections you will learn how to use Taiko's implicit
assertions use your own custom assertions.

## Implicit assertions

Taiko's selector(s) checks if an element is visible on the page before performing 
an action. A test will fails by throwing an [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) when the element is not visible on the page (or covered by another element for example a modal dialogue). 

In the following script

    const { openBrowser, goto, click, closeBrowser } = require('taiko');
    (async () => {
      await openBrowser();
      await goto("google.com");
      await click("Google Search");
    })();   
      
the test fails when

* `openBrowser()` cannot launch a browser instance.
* The browser instance cannot navigate to `google.com` (network 
    connectivity issues or non 200 status code) 
* An element with text `Google Search` is not visible, is hidden or covered.

All Page actions, browser actions, selectors, proximity 
selectors have implicit assertions.

### Ignoring implicit assertions

To ignore implicit assertions use JavaScript's `try` and `catch` block to handle the error

    const { openBrowser, goto, click, closeBrowser } = require('taiko');
    (async () => {
      await openBrowser();
      await goto("google.com");
      try {
        await click("Google Search");
      } catch(e) {
        //Ignore or log the error.
      } finally {
        closeBrowser();
      }
    })();   

## Custom assertions

You can use any Node.js assertion framework along with Taiko's
API. For example using node's 
[`assert`](https://nodejs.org/api/assert.html#assert_strict_assertion_mode) function.

    const { openBrowser, goto, click, closeBrowser } = require('taiko');
    const assert = require('assert').strict;

    (async () => {
      await openBrowser();
      await goto("google.com");
      assert.equal(button({name: 'btnK'}).text(), 'Google Search');
      closeBrowser();
    })();   

Here node's `assert` function fails when the name a `button` with the 
name `btnK` does not have the text 'Google Search'.

To check if an element without performing an action use
`exists` on a selector API for example

    const { openBrowser, goto, click, closeBrowser } = require('taiko');
    const assert = require('assert').strict;

    (async () => {
      await openBrowser();
      await goto("google.com");
      await assert.ok(await button('Gmail').exists());
      await closeBrowser();
    })();   

By default `exists` waits for `100000` milliseconds checking every `100` milliseconds
if the element is visible on the screen. 

If you want to check the element on the page immediately (checking if an element does not exist) 
you can use set these wait times to `0`.

    const { openBrowser, goto, click, closeBrowser } = require('taiko');
    const assert = require('assert').strict;

    (async () => {
      await openBrowser();
      await goto("google.com");
      await assert.ok(!await text('Facebook').exists(0,0));
      await closeBrowser();
    })(); 