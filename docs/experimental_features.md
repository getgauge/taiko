---
layout: page.njk
---

## Firefox support

To launch Taiko with firefox:

* Download and install [firefox nightly](https://www.mozilla.org/en-US/firefox/all/#product-desktop-nightly)
* Set TAIKO_BROWSER_PATH to firefox nightly's executable.
 ```
 TAIKO_BROWSER_PATH="/Applications/Firefoxnightly.app/Contents/MacOS/firefox" npx taiko
 ```

A few known issues

* Highlighting element on action is set to false as overlay domain is not supported
* `openTab/closeTab` does not work as expected since `New` is not available in firefox yet
* Autofocus on first input field does not happen
* `file:// protocol` does not emit events
* `waitFoNavigation` does not wait for network calls and frame loads

## TypeScript Support

When using Gauge together with Taiko with [gauge-ts](https://github.com/BugDiver/gauge-ts/) 
using

    npm install @getgauge/cli
    gauge init ts

You can optionally configure your project to use our experimental type definitions. 
Edit your `tsconfig.json` and add the following lines:

    {
        "compilerOptions": {
            // gauge-ts default configuration here
            // add experimental taiko TypeScript Type Definition folder to the project
            "typeRoots": ["node_modules/@types", "node_modules/taiko/types"],
            // use taiko types in the project
            "types": ["node", "taiko"]
        }
    }

