---
layout: page.njk
---
# Assertions

A test is as good as it's assertions. Taiko's API
implicitly asserts on test runs for example in the 
following test

## Native assertions

Taiko's implicit assertions Implicit asssertions are assertions by Taiko's
API after executing a commmand on the browser instance, 
for example in the following script:

    const { openBrowser, goto, click, closeBrowser } = require('taiko');
      await openBrowser();
      await goto("google.com");
      await click("Google Search");
    })();   
      
the test fails when.

* `openBrowser()` cannot launch a browser instance.
* The browser instance cannot navigate to `google.com` (network 
    connectivity issues or non 200 status code) 
* An element with text `Google Search`, is not there or is hidden.

All API's under Page actions, browser actions, selectors, proximity 
selectors use implicit assertions.

### Overriding native assertions

To override native assertions you can use use javascripts error handling 
mechanism as follows

    const { openBrowser, goto, click, closeBrowser } = require('taiko');
      await openBrowser();
      await goto("google.com");
      try {
        await click("Google Search");
      } catch(e) {
        //Ignore or log the error.
      }
    })();   

In some cases you might want to override the wait time. You can do this 
as follows. In this case Taiko will not wait for the element to appear.

## User assertions

Users can also use any javascript assertion framework along with Taiko's
API to define their own assertions.

For e.g.

    const { openBrowser, goto, click, closeBrowser } = require('taiko');
      await openBrowser();
      await goto("google.com");
      await click("Google Search");

      assert(text("something").exists());
    })();   

Here node's `assert` function checks for the condition and fails.



