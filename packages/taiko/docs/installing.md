---
layout: page.njk
---

Taiko is a [Node.js](https://nodejs.org) library and runs on all platforms that is
supported by [Node.js](https://nodejs.org) latest LTS version (Windows, MacOS, Linux). 

Once you have the latest version of node installed you can install
and run Taiko in any of the following ways.

## Quick Installation

If you want to experiment or quickly automate a web page you 
can get started with Taiko using Node's `npx` package runner. 

```
npx taiko
```

This will download chromium browser and launch [Taiko's recorder](/using_the_recorder). You can also use `npx` to run existing taiko 
scripts for example

```
npx taiko sample.js
```

Note: Depending on how you install Taiko `npx` either caches or downloads Taiko
refer the `npx` [documentation](https://blog.npmjs.org/post/162869356040/introducing-npx-an-npm-package-runner)
for more information.

## Global Installation

If prefer having the `taiko` command installed globally, you can run

```
npm install -g taiko
```

To verify your installation run

```
taiko --version
```

You should see something as follows (x = current version numbers)

```
taiko --version
Version: 1.x.xx (Chromium: x.x.x) RELEASE
```

If everything looks fine, try [using the recorder](using_the_recorder) to record a test.

## Local installation

As any other [Node.js](https://nodejs.org) library Taiko, you can add Taiko to your node projects 
by running

```
npm install -D taiko
```

This will add Taiko as a dev dependency in your project's `package.json`

You can also run 

```
npx taiko
```

To launch the Taiko recorder locally. This will refer to the local installation
of Taiko in the `node_modules` folder.

## Unreleased versions

If you want to experiment with unreleased versions and try out
experimental features that you can install Taiko directly from Github 
using 

```
npx https://github.com/getgauge/taiko
```

or

```
npm install -g https://github.com/getgauge/taiko
```

or 

```
npm install -D https://github.com/getgauge/taiko
```

or 

```
// package.json
...
"dependencies": {
"taiko": "getgauge/taiko",
}
....
```

## Install options

You can skip downloading chromium while running or install Taiko
by setting the environment variable `TAIKO_SKIP_CHROMIUM_DOWNLOAD`
to `true` for example in `bash` or `zsh`

```
TAIKO_SKIP_CHROMIUM_DOWNLOAD=true npx taiko
```

Each Operating System has it's own way of setting environment variables
please refer OS specific instructions on how to do that.

## Installing as `root` User

Note: Avoid installing Taiko as a root user unless you are using 
docker containers. Refer to `npm` and [Node js](https://nodejs.org) documentation for 
installing packages using the right permissions.

When installing taiko globally as a `root` user, `npm` explicitly changes the UID and GID,
which can cause the installation to fail with `Permission Denied` error.

The solution to fix this is to pass `--unsafe-perm --allow-root` to `npm`

```
npm install -g taiko --unsafe-perm --allow-root
```
