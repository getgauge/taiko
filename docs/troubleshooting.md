---
layout: page.njk
---

Troubleshooting tips to commonly reported problems.

## Running on Linux

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

## Raspberry PI with Raspbian

Taiko's bundled chromium instance is not built for arm platforms like
the Raspberry PI. For raspbian please install the package `chromium-browser`
and skip Taiko's browser download

    apt install chromium-browser
    TAIKO_SKIP_CHROMIUM_DOWNLOAD=true npm install -g taiko
    `TAIKO_BROWSER_PATH=$(which chromium-browser)` taiko

## Headless mode and sandbox

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