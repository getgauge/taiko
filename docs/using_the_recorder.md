---
layout: page.njk
---

Taiko comes with a Recorder that’s a [REPL](https://en.wikipedia.org/wiki/Read–eval–print_loop) to write test scripts. 

You can use Taiko’s API to control the browser from Taiko's REPL. The commands
e

## Launching

After making sure you have the latest 
version of Node.js installed of you machine you can launch the REPL in 
your favorite terminal application using.

```
npx taiko
```

This launches the Taiko prompt.

```
Version: 1.x.x (Chromium: XX.x.x)
Type .api for help and .exit to quit
> 
```

## Exploring

Taiko REPL command `.api` lists all the API that is available in
the following format. (This is shortened to show a sample output structure)

```
> .api

Browser actions
    openBrowser, closeBrowser
    ...

Page actions
    goto, reload, goBack
    ...

...
```

If you need more info on any of the Taiko's API like paramters
and example usage you can run `.api` on the API

```
> .api click
Fetches an element with the given selector, scrolls it into view if needed, 
and then clicks in the center of the element...

Parameters:
...

Returns: Promise

Example:
  await click('Get Started')
  ...
```

## Running commands

To start automating the browser you can type in Taiko's API. For example
to lauching a browser instance

```
> openBrowser()
```

This launches an instance of Chromium that is bundled with Taiko.

![Open Browser Screenshot](/assets/images/openBrowser.png)

To automate this Chrome browser instance, you can use other commands 
from the Taiko API. Here's another example to get the browser to search 
google for something.

```
> goto("google.com")
> write("taiko test automation")
> click("Google Search")
```

These commands get the browser to

* go to Google’s home page,
* type the text "taiko test automation" and then
* click on the "Google Search" button.

You can see the browser performing these actions as you type and press enter for 
each command.

![Recorder](/assets/images/recording.gif)

## Generate code

Taiko’s REPL keeps a history of all successful commands. Once you finish a flow of execution, 
you can generate a test script using the special command `.code`

```
> .code
```

This command generates readable and maintainable JavaScript code.

```
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
```

You can copy and modify this code or save it directly to a file using


```
.code googlesearch.js
```

## Stopping
Choose to continue automation or finish the recording using

```
.exit
```

## Load plugins

## Other options