---
layout: page.njk
---

This tutorial shows how to setup Taiko tests in Docker. The Docker image 
created as a part of this tutorial can be used to run tests locally or on 
a CI/CD setup.

The [`Dockerfile`](https://github.com/getgauge/template-js/blob/master/Dockerfile) in this 
sample uses [Gauge](https://gauge.org) to run the tests, However, you can modify the 
[`Dockerfile`](https://github.com/getgauge/template-js/blob/master/Dockerfile) to exclude it 
or use another test runner.

## Prerequisites

* [NodeJS](https://nodejs.org/en/)
* [Docker](https://www.docker.com/)
* [Gauge](https://gauge.org)

## Setup a sample project

```
 gauge init js
 ```

This creates a Gauge+Taiko project sample with a [`Dockerfile`](https://github.com/getgauge/template-js/blob/master/Dockerfile)
in the current directory.

## Using the Dockerfile

### Building the image

Run the following command from the project's folder

 ```
 docker build -t gauge-taiko .
 ```

### Running tests

 ```
 docker run  --rm -it -v ${PWD}/reports:/gauge/reports gauge-taiko
 ```

The test reports are created in the `reports` folder in the current directory.

 ## A note on the flags and options

### TAIKO_BROWSER_ARGS
Taiko reads `TAIKO_BROWSER_ARGS` environment variable and passes the values as command line 
arguments to the Chromium browser it launches. 

> Note: this does not apply if the browser is launched independently and Taiko is made to connect to the 
already running browser instance.

 ### ---no-sandbox
 Lighthouse-ci has documented chrome sandboxing and nuances with Docker here - 
 [--No-sandbox Issues are explained](https://github.com/GoogleChrome/lighthouse-ci/blob/master/docs/recipes/docker-client/README.md#--no-sandbox-issues-explained) -
"Chrome uses sandboxing to isolate renderer processes and restrict their capabilities. 
If a rogue website is able to discover a browser vulnerability and break out of JavaScript 
engine for example, they would find themselves in a very limited process that can't write 
to the filesystem, make network requests, mess with devices, etc."

There are several options to run Chrome headless in Docker. Puppeteer 
has [a couple of recommendations](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#setting-up-chrome-linux-sandbox).

 According to [Lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci/blob/master/docs/recipes/docker-client/README.md#--no-sandbox-container-tradeoffs), passing `--no-sandbox` may not be a bad option. The same applies to Taiko as well. 
 Please note that several options (other than passing `--no-sandbox` to chrome) require 
 permissions/changes that apply to the entire container. 

### --start-maximized
Modern websites are often built to be responsive. To ensure that the browser 
opens in full view-port use `--start-maximized` flag. Alternatively, set `--window-size` 
flag to open the website in specific viewport size.

### --disable-dev-shm

By default, Docker runs a container with a /dev/shm shared memory space 64MB. This 
is [typically too small](https://github.com/c0b/chrome-in-docker/issues/1) for Chrome 
and will cause Chrome to crash when rendering large pages. To fix, run the container 
with `docker run --shm-size=1gb` to increase the size of `/dev/shm`. Since Chrome 65, 
this is no longer necessary. Instead, launch the browser with the `--disable-dev-shm-usage` 
flag: - [Puppeteer troubleshooting tips](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#tips)

## Project code in docker
The project code can be made available on the Docker using various methods (besides adding it to the container at build time).

* [docker cp](https://docs.docker.com/engine/reference/commandline/cp/)
* [git clone](https://git-scm.com/docs/git-clone)
* [volume mounting](https://docs.docker.com/storage/volumes/) the entire project will mount the 
`node_modules` as well. 
 
`node_modules` can have OS specific files which also get mounted on to the Docker. If the Docker is 
running for a different OS configuration, this will give errors unless `node_modules` is deleted before mounting. 