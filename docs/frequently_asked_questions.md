---
layout: page.njk
---

<details>
<summary>Which browser does Taiko support?</summary>

Taiko can be used to automate the latest versions of

* Chrome/Chromium
* Microsoft Edge
* Opera (unverified)

The following browsers are NOT supported

* Firefox
* Safari

</details>

<details>
<summary>Will Taiko support Firefox any time in the future?</summary>

Yes. Taiko is built on Chrome DevTools Protocol, support for which is
slowly being added to Firefox. Taiko should work out of the box for
Firefox when all [CDP features](https://github.com/getgauge/taiko/wiki/Taiko-CDP-Dependencies) 
are implemented. 

</details>

<details>
<summary>Can I use Taiko to test mobile applications?</summary>

No. Taiko can only test web applications using chromium/chrome based
browsers. If you are looking to test chrome browser on android you 
can try the Taiko [android](https://github.com/saikrishna321/taiko-android)
plugin.

</details>

<details>
<summary>Can I write Taiko tests in a language other than 
Javascript?</summary>

Taiko is a Node.js library and Taiko tests can only be written
Javascript or languages that compile to Javascript for example 
[Typescript](https://gist.github.com/nuclearglow/b883ce341a800ed958cb73ca10266aae).

</details>

<details>
<summary>Can I skip downloading Taiko's bundled chromium browser
while installing or running Taiko?</summary>

To skip downloading chromium you can set the 
`TAIKO_SKIP_CHROMIUM_DOWNLOAD` 
[environment variable](https://docs.taiko.dev/#taiko-env-variables)
for example

```
TAIKO_SKIP_CHROMIUM_DOWNLOAD=true npm install -g taiko
```

or set the following property in [`.npmrc`](https://docs.npmjs.com/configuring-npm/npmrc.html)
file
```
taiko_skip_chromium_download=true
```
</details>

<details>
<summary>I have a few issues launching the browser instance in Linux</summary>

Taiko bundles the latest Chromium browser
binary. Linux distributions used in docker 
may need installation of chromium dependencies for it to launch 
and work. If you have trouble launching the browser
instance use the `ldd` command on Taiko's chromium download in 
the `node_modules` folder to list missing dependencies for example

    ldd node_modules/taiko/.local-chromium/linux-xxxxxx/chrome-linux/chrome | grep 'not found'
    libX11-xcb.so.1 => not found
    libXtst.so.6 => not found
    libnss3.so => not found
    libnssutil3.so => not found
    libsmime3.so => not found
    libnspr4.so => not found
    libXss.so.1 => not found
    libasound.so.2 => not found
    libatk-bridge-2.0.so.0 => not found
    libatspi.so.0 => not found
    libgtk-3.so.0 => not found
    libgdk-3.so.0 => not found

Make sure you install these missing dependencies using linux 
distributions package manager like `apt`

</details>

<details>
<summary>How do I run Taiko on a Raspberry PI (Raspbian)</summary>

Taiko's bundled chromium instance is not built for arm platforms like
the Raspberry PI. For raspbian please install the package `chromium-browser`
and skip Taiko's browser download

    apt install chromium-browser
    TAIKO_SKIP_CHROMIUM_DOWNLOAD=true npm install -g taiko
    `TAIKO_BROWSER_PATH=$(which chromium-browser)` taiko

</details>

<details>
<summary>How do I launch chrome in sandbox mode on headless environments</summary>

If you have issues running taiko in headless mode in dockerized 
or virtualized linux environments. You might need to configure a sandbox 
using one of the following ways

* Enable user namespace cloning:
    ```
    sudo sysctl -w kernel.unprivileged_userns_clone=1
    ```
* Or using a [setuid](https://chromium.googlesource.com/chromium/src.git/+/master/docs/linux/suid_sandbox_development.md) sandbox

To disable sandboxing launch chromium with below arguments:

    await openBrowser({args: ['--no-sandbox', '--disable-setuid-sandbox']}); 

Disabling sandbox is not recommended unless you trust the content being loaded.

</details>

<details>
<summary>How do I intercept request with method options</summary>

To ensure CORS security browser sends requests with method `OPTIONS` 
for cross-orgin resource access and currently there is no way to intercept such requests

As a workaround security can be disabled like below,

    await openBrowser({ args: ["--disable-web-security"] });

</details>


<details>
<summary>How can I optimize chrome instances for parallel runs?</summary>

To improve load time when running tests in parallel on cloud, following 
chromium command line args are recommended

    await openBrowser({args: [
                        '--disable-gpu',
                        '--disable-dev-shm-usage',
                        '--disable-setuid-sandbox',
                        '--no-first-run',
                        '--no-sandbox',
                        '--no-zygote']}); 

</details>

<details>
<summary>How do I enable debug log events</summary>

Run with below env to enable debug logs

    env DEBUG="taiko:*" taiko code.js

</details>

<details>
<summary>How can I customize Taiko's wait events</summary>

By default, Taiko  waits for any network requests triggered as part of an action, 
frame load, frame navigation and new target navigation. Navigation actions like 
`goto`, `reload` wait for `loadEventFired`. 

There can be scenarios where Taiko might miss an action that takes time to trigger events.
Below are few where waiting for appropriate events will improve 
performance and reduce flakiness in tests.

* `firstMeaningfulPaint` - Wait for this event if an action can trigger a page load 
which has heavy image or fonts to loaded.
* `targetNavigated` - Wait for this event if there is a new tab/window open or close 
that happens because of an action.
* `loadEventFired` - Wait for this event if an action triggers a page load which is not instanteneous.

For example

    await click(link('open new tab'),{waitForEvents:['targetNavigated']})

</details>