---
layout: page.njk
---

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

