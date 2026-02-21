---
layout: page.njk
---

The `taiko` command is a basic runner for Taiko scripts. Taiko's
runner logs command execution.

```
> taiko google.js
✔ Browser opened
✔ Navigated to URL http://google.com
✔ Wrote Taiko testing into the focused element.
✔ Pressed the Enter key
✔ Browser closed
```

A Taiko script can also be run using node (messages from Taiko's
API will not be logged to the console).

```
node google.js
```

However if you want other features like 

* Test case management
* Running tests in parallel
* Reports
* Test data management

The sections below describe integration with a few popular runners.

## Gauge

We recommend using Taiko with [Gauge](https://gauge.org). Gauge is a test runner 
for writing readable and reusable acceptance tests in markdown format. It is easy 
to install and well integrated with Taiko.

Install Gauge using `npm`

```
npm install -g @getgauge/cli
```

and initialize a sample Taiko project using

```
gauge init js
```

This will create the following directory structure

```
.
├── env
│   └── default
│       ├── default.properties
│       ├── headless.properties
│       └── js.properties
├── manifest.json
├── package.json
├── specs
│   └── example.spec
└── tests
    └── step_implementation.js
```

The steps in `example.spec` are implemented in Taiko in the file
`step_implementation.js`

You can run the test using 

```
npm test
```

You can also use Taiko's recorder to generate gauge steps using 
`.step` command by running the following in the test project 
directory

```
npx taiko
> openBrowser()
> goto('google.com')
> write('Gauge test automation')
> press('Enter')
```

It generates a step like below

```
step(" ", async () => {
    await goto("google.com");
    await write("Gauge test automation");
    await press("Enter");
}); 
```

To save a step to a new or modify a step implementation file using

```
.step tests/step_implementation.js
```

Now that you've created your project with Gauge and Taiko, you can start 
to [write test specifications](https://docs.gauge.org/writing-specifications.html) using Gauge. 
You can see how Gauge and Taiko work together from this sample project.

## Mocha

Initialise an npm project

```
npm init -y
```

Install [mocha](https://mochajs.org) 

```
npm i -D mocha
```

Install Taiko

```
npm i -D taiko
```

Create a test file

```
mkdir test
$EDITOR test/test.js # or create this file using any editor
```

Add a Taiko script to `test.js`

```
const { openBrowser, goto, closeBrowser, write, press } = require('taiko');

describe('Taiko with Mocha', () => {
    before(async() => {
        await openBrowser();
    });

    describe('Google search', async() => {
        it('should use Taiko to search google', async() => {
            await goto('google.com');
            await write('flying foxes');
            await press('Enter');
            });
        });

        after(async() => {
            await closeBrowser();
        });
    });

```

Run the tests using

```
npx mocha
```

## Jest

Initialize an npm project

```
npm init -y
```

Install [jest](https://jestjs.io)

```
npm i -D jest
```

Install Taiko

```
npm i -D taiko
```

Create a test file

```
$EDITOR jest.test.js # or create this file using any editor
```

Add a Taiko script to `jest-test.js`

```
const { openBrowser, goto, closeBrowser, write, press } = require('taiko');

describe('Taiko with Jest', () => {
    beforeAll(async() => {
        await openBrowser();
    });

    describe('Google search', () => {
        test('should use Taiko to search google', async() => {
            await goto('google.com');
            await write('flying foxes');
            await press('Enter');
        });
    });

    afterAll(async() => {
        await closeBrowser();
    });
});

```

Run the test

```
npx jest
```