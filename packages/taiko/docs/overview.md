---
layout: page.njk
---

Taiko is free and open source [Node.js](https://nodejs.org/en/) library 
with a simple API to automate Chromium based browsers (Chrome, 
Microsoft Edge, Opera) and Firefox. 

Taiko tests are written in JavaScript or any language that compiles
to JavaScript, for example [TypeScript](https://www.typescriptlang.org).

## Why Taiko ?

Taiko's API is designed for testers. Unlike other testing frameworks, 
Taiko treats the browser like a black box. With Taiko you can write scripts by looking 
at a web page and without inspecting its source code. 

For example on google.com, this command will click on any element with the text 
'Google Search' (a button on the page).

    click("Google Search")

Taiko’s API mimics user interactions with the browser. For example if you want to 
write into an element that’s currently in focus, use

    write("something") 

Or, if you want to write into a specific text field

    write("something", into(textBox({placeholder: "Username"})))

And, of course other selectors including XPath for rare use cases

    click({id: "elementId"})
    click($(`//*[text()='text']`))


Taiko's API also implicitly waits for the web page or the elements in the page to finish loading. 
This considerably speeds up your tests. Taiko tests run fast, [really fast](https://gauge.org/2019/08/21/how-taiko-compares-to-other-browser-automation-tools/). 
Here's a quick comparison with other tools.

<script src="https://gist.github.com/NivedhaSenthil/919cdb1f9d8d3fee493bd428a851d125.js"></script>

<small>* Source code for running this comparison is available on [Github](https://github.com/getgauge-contrib/compareBrowserAutomationTools/tree/master/comparePerformanceAndReliableWaitsOfTools)</small>

## Running a test
Here's what a simple Taiko script looks like 

    const { openBrowser, goto, write, click, closeBrowser } = require('taiko');

    (async () => {
        await openBrowser();
        await goto("google.com");
        await write("taiko test automation");
        await press("Enter");
        await closeBrowser();
    })();

To run this script, install the latest version of [Node.js](https://nodejs.org/en/),
save the script to JavaScript file (for example `test.js`), run the 
following in your favorite CLI (Command Line Interface) 

    $ npx taiko test.js
    ✔ Browser opened
    ✔ Navigated to url "http://google.com"
    ✔ Wrote taiko test automation into the focused element.
    ✔ Clicked element containing text "Google Search"
    ✔ Browser closed 

This command will download the latest 
version of the [Chromium](https://www.chromium.org/Home) browser and run the tests 
in [headless](https://developers.google.com/web/updates/2017/04/headless-chrome#drivers) 
mode. If you want to see how the tests execute in the browser window you can use
the `--observe` option. 

    $ npx taiko test.js --observe

## Recording a test

Taiko comes with a Recorder writing test scripts. You can launch the recorder (after installing
the latest version of Node.js) by simply running

    $ npx taiko

This launches the Taiko prompt

    Version: 1.x.x (Chromium:XX.x.x)
    Type .api for help and .exit to quit
    >  

You can now use Taiko’s API as commands in this prompt. For example, to 
launch a Chrome browser instance use

    > openBrowser()

To automate this Chrome browser instance, you can use other commands from the Taiko API. 
Here's the example for searching Google.

    > goto("google.com")
    > write("taiko test automation")
    > click("Google Search")

You can see the browser performing the actions as you type and press enter for each
command.

![Taiko recorder](/assets/images/recorder.gif)

Taiko’s REPL keeps a history of all successful commands. Once you finish a flow of execution, 
you can generate a test script using the special command `.code`

    > .code

On execution, Taiko generates readable and maintainable JavaScript code.

    const { openBrowser, goto, write, click } = require('taiko');
    (async () => {
    try {
        await openBrowser();
        await goto("google.com");
        await write("taiko test automation");
        await click("Google Search");
    } catch (error) {
        console.error(error);
    } finally {
        closeBrowser();
    }
    })();

You can copy and modify this code or save it directly to a file in
the directory where you launched the recorder using

    .code test.js

Choose to continue automating or finish the recording using

    > .exit

Like mentioned earlier, you can run this script using

    $ npx taiko test.js

## Taiko vs Selenium

Taiko is very different from [Selenium](https://www.selenium.dev). Selenium uses 
[WebDriver](https://www.w3.org/TR/webdriver/) a W3C standard.
Taiko uses [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).
Taiko does not need a driver (like ChromeDriver) to connect to and automate the browser.
Taiko bundles the latest version of Chromium, however it can automate any browser that
supports the Chrome DevTools Protocol. 

Taiko does not support Webkit based browsers like Safari. Taiko does not support
testing mobile applications. There are no plans to support this in the future.

Also unlike Selenium, which can be scripted in many programming languages, Taiko will 
only support JavaScript and languages or languages that compile to JavaScript.

Selenium is a general purpose browser automation tool and Taiko's API will remain
focused on testing.

Please use Selenium if you need
* Extensive cross browser testing
* Support for programming languages other than JavaScript
* Have your tests running on services like Browserstack and Saucelabs
* Distribute tests using something like Selenium grid
* Need a GUI based click and record option like Selenium IDE
* Use a design pattern to organize your source code like the Page Object pattern

Try out Taiko if you
* Want to work with the JavaScript and the [Node.js](https://nodejs.org) eco-system
* Do not want to install or manage drivers 
* Want an easy to use API with implicit waits
* Focus on end to end or user journey testing of your web application
* Want a command line recorder for scripting tests
* Run tests on headless mode by default
* Run tests on managed docker instances
* Faster test runs

## Useful links

* [Introducing Taiko](https://thirstyhead.com/introducing-taiko/slides/en-us/index.html)
* [Taiko: Reliable Browser Automation: An Introduction](https://www.youtube.com/watch?v=9F0Y1nCYLQw)
* [User Journey Testing With Gauge And Taiko](https://www.youtube.com/watch?v=RxASYh94JOs)
