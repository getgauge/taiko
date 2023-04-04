# Taiko
##### [Docs](https://docs.taiko.dev) | [API reference](https://docs.taiko.dev/api/reference) 

A Node.js library for testing modern web applications

[![Actions Status](https://github.com/getgauge/taiko/workflows/taiko/badge.svg)](https://github.com/getgauge/taiko/actions)
[![License MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/getgauge/taiko/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/taiko.svg?style=flat-square)](https://badge.fury.io/js/taiko)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/getgauge/taiko/issues)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v1.4%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)


![Taiko REPL](https://user-images.githubusercontent.com/44019225/60337143-da31a280-99bf-11e9-80a4-57917d81e0b6.gif)

# What’s Taiko?

Taiko is a free and open source browser automation tool built by the team behind [Gauge](https://gauge.org/) from [ThoughtWorks](https://www.thoughtworks.com/). Taiko is a Node.js library with a clear and concise API to automate **Chromium based browsers**(Chrome, Microsoft Edge, Opera) and Firefox. Tests written in Taiko are highly readable and maintainable.

With Taiko it’s easy to

* Get Started
* Record/Write/Run tests

Taiko’s smart selectors make tests reliable by adapting to changes in the structure of your web application. With Taiko there’s no need for id/css/xpath selectors or adding explicit waits (for XHR requests) in test scripts.

## Features

Taiko is built ground up to test modern web applications. Here’s a list of a few unique features that sets it apart from other browser automation tools.

* Easy Installation
* Interactive Recorder
* Smart Selectors
* Handle XHR and dynamic content
* Request/Response stubbing and mocking

# Getting Started

## Easy Installation

Taiko works on Windows, MacOS and Linux. You only need [Node.js](https://nodejs.org/en/) installed in your system to start writing Taiko scripts in JavaScript. After you’ve installed Node.js open a terminal application (or powershell in the case of Windows) and install Taiko using [npm](https://www.npmjs.com/) with the command

    $ npm install -g taiko

This installs Taiko and the latest version of Chromium browser. We are all set to do some testing!

## Interactive Recorder

Taiko comes with a Recorder that’s a REPL for writing test scripts. You can use Taiko’s JavaScript API to control the browser from the REPL. To launch the REPL type taiko in your favorite terminal application

    $ taiko
    Version: 0.8.0 (Chromium:76.0.3803.0)
    Type .api for help and .exit to quit
    >

This launches the Taiko prompt. You can now use Taiko’s API as commands in this prompt. For example, launch a Chromium browser instance using

    > openBrowser()

You can now automate this Chromium browser instance with commands, for example, make the browser search google for something.

    > goto("google.com/?hl=en")
    > write("taiko test automation")
    > click("Google Search")

These commands make the browser go to google’s home page, type the text "taiko test automation" and click on the "Google Search" button. You can see the browser performing these actions as you type and press enter for each command.

Taiko’s REPL keeps a history of all successful commands. Once you finish a flow of execution, you can generate a test script using the special command .code

    > .code
    const { openBrowser, goto, write, click, closeBrowser } = require('taiko');

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

Taiko generates readable and maintainable JavaScript code. Copy and modify this code or
save it directly to a file using

    > .code googlesearch.js

You can choose to continue automating or finish the recording using

    > .exit

To run a Taiko script pass the file as an argument to taiko

    $ taiko googlesearch.js
    ✔ Browser opened
    ✔ Navigated to url "http://google.com"
    ✔ Wrote taiko test automation into the focused element.
    ✔ Clicked element containing text "Google Search"
    ✔ Browser closed

By default Taiko runs the script in headless mode, that means it does not launch a browser window. This makes it easy to run Taiko in containers (ex. Docker). To view the browser when the script executes use

    $ taiko googlesearch.js --observe

Taiko’s REPL also documents all the API’s. To view all available API’s use the special command `.api`

    $ taiko
    Version: 0.8.0 (Chromium:76.0.3803.0)
    Type .api for help and .exit to quit
    > .api
    Browser actions
        openBrowser, closeBrowser, client, switchTo, setViewPort, openTab, closeTab
    ...

To see more details of an API along with examples use

    >.api openBrowser

    Launches a browser with a tab. The browser will be closed when the parent node.js process is closed.

    Example:
        openBrowser()
        openBrowser({ headless: false })
        openBrowser({args:['--window-size=1440,900']})


## Smart Selectors

Taiko’s API treats the browser as a black box. With Taiko we can write scripts by looking at a web page and without inspecting it’s source code For example on `google.com` the command

    > click("Google Search")

clicks on any element with the text `Google Search` (a button on the page at https://google.com). Taiko’s API mimics user interactions with the browser. For example if you want to write into an element that’s currently in focus use

    > write("something")

Or if you want to write into a specific text field

    > write("something", into(textBox({placeholder: "Username"})))

With Taiko’s API we can avoid using ids/css/xpath selectors to create reliable tests that don’t break with changes in the web page’s structure.

You can also use Taiko’s proximity selectors to visually locate elements. For example

    > click(checkBox(near("Username")))

Will click the checkbox that is nearest to any element with the text `Username`.

Taiko also supports XPath and CSS selectors

    > click($("#button_id")) // Using CSS selector
    > click($("//input[@name='button_name']")) // XPath selector

## Handle XHR and dynamic content

Taiko’s API listens to actions that trigger XHR request or fetch dynamic content and automatically waits for them to complete before moving on to the next action. Taiko implicitly waits for elements to load on the page before performing executing the command. Scripts written in Taiko are free of explicit local or global waits and the flakiness.

## Request/Response stubbing and mocking

Setting up test infrastructure and test data is hard. Taiko makes this easy with the intercept API. For example, block requests on a page  (like Google Analytics or any other resource)

    > intercept("https://www.google-analytics.com/analytics.js");

Or redirect an XHR request on the page to a test instance

    > intercept("https://fetchdata.com", "http://fetchtestdata.com")

Or stub an XHR request to return custom data

    > intercept("https://fetchdata.com", {"test": data})

Or even modify data sent by XHR requests

    > intercept("https://fetchdata.com", (request) => {request.continue({"custom": "data"})})

This simplifies our test setups as we don’t have to set up mock servers, or replace url’s in tests to point to test instances.

## Integrating with Gauge

We recommend using Taiko with [Gauge](https://gauge.org/). Gauge is a framework for writing readable and reusable acceptance tests. With features like markdown specifications, data driven execution, parallel execution and reporting Gauge makes test maintenance easy. Gauge is easy to install and well integrated with Taiko. With Gauge and Taiko we can write reliable acceptance tests.

Install Gauge using npm and initialize an initialize and sample Taiko project using

    $ npm install @getgauge/cli
    $ gauge init js

Learn more about [Gauge](https://docs.gauge.org)!

### Experimental Firefox Support

#### To launch taiko with firefox:
- Download and install [firefox nightly](https://www.mozilla.org/en-US/firefox/all/#product-desktop-nightly) 
- Set `TAIKO_BROWSER_PATH` to firefox nightly's executable.

Example: `TAIKO_BROWSER_PATH="/Applications/Firefoxnightly.app/Contents/MacOS/firefox" taiko`

#### Known Issues for now:  
- Highlighting element on action is set to false as overlay domain is not supported
- openTab/closeTab does not work as expected since `New` is not available in firefox yet
- Autofocus on first input field does not happen
- file:// protocol does not emit events
- waitFoNavigation does not wait for network calls and frame loads

### Experimental TypeScript Support

When using Gauge together with Taiko with [gauge-ts](https://github.com/BugDiver/gauge-ts/) using

    $ npm install @getgauge/cli
    $ gauge init ts

## Documentation

* [API](https://docs.taiko.dev)

## Branding

* [Brand Style Guide](https://brand.taiko.dev) which includes assets like logos and images.

## Inspired by

* [Helium](https://heliumhq.com/)
* [Puppeteer](https://github.com/GoogleChrome/puppeteer)

## Talk to us

* [Discussions](https://github.com/getgauge/taiko/discussions) for questions and help
* [Github Issues](https://github.com/getgauge/taiko/issues) to report issues
