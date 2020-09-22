---
layout: page.njk
---

## Running Taiko in docker

Sample code used in this documentation is available on Github. 

The tutorial shows how to run Gauge and Taiko tests using Taiko. The docker image created as a part of this tutorial can be used to run tests locally and well or on a CI/CD setup.

## Prerequisites

* [NodeJS](https://nodejs.org/en/)
* [Docker](https://www.docker.com/)

## Setup a sample project

Create a Gauge+Taiko project. This article (and the sample) uses the default Gauge JavaScript template:

```
gauge init js
```

## Create a Docker image

Use the [docker file](https://docs.docker.com/engine/reference/builder/) listed below to create a reusable docker image.

## Dockerfile

```
# This image uses the official node base image.
FROM node:12.18.3-buster-slim@sha256:dd6aa3ed10af4374b88f8a6624aeee7522772bb08e8dd5e917ff729d1d3c3a4f
 
# The Taiko installation downloads and installs the chromium required to run the tests. 
# However, we need the chromium dependencies installed in the environment. These days, most # Dockerfiles just install chrome to get the dependencies.
RUN apt-get update \
     && apt-get install -y wget gnupg ca-certificates \
     && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
     && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
     && apt-get update \
     && apt-get install -y google-chrome-stable
  
# Set a custom npm install location so that Gauge, Taiko and dependencies can be 
# installed without root privileges
ENV NPM_CONFIG_PREFIX=/home/gauge/.npm-packages
ENV PATH="${NPM_CONFIG_PREFIX}/bin:${PATH}"

# Add the Taiko browser arguments
ENV TAIKO_BROWSER_ARGS=--no-sandbox,--start-maximized,--disable-dev-shm-usage
ENV headless_chrome=true
ENV TAIKO_SKIP_CHROMIUM_DOWNLOAD=true
ENV TAIKO_BROWSER_PATH=/usr/bin/google-chrome
 
# Add test code
ADD . /gauge

# Set working directory
WORKDIR /gauge
 
# Create an unprivileged user to run Taiko tests
RUN groupadd -r gauge && useradd -r -g gauge -G audio,video gauge && \
   mkdir -p /home/gauge && \
   chown -R gauge:gauge /home/gauge /gauge
 
USER gauge
 
# Install dependencies and plugins
RUN npm install -g @getgauge/cli \
    && npm install \
    && gauge install \
    && gauge install screenshot \
    && gauge config check_updates false

# Default command on running the image
ENTRYPOINT ["npm", "test"]
```

## Build the docker image

```
docker build -t gauge-taiko .
```

## Run tests 
docker run --rm -v gauge-reports:/gauge/reports gauge-taiko 

The reports will be available on the host machine in the gauge-reports directory after the run.

## View Reports

To see the reports on the host machine, volume mount the gauge reports folder by using the parameter `-v $(pwd)/gauge-reports:/gauge/reports`. Then the reports will be available on the host machine in the `gauge-reports` directory.

## A note on the flags used
Taiko reads TAIKO_BROWSER_ARGS environment variable and passes the values as command line arguments to the chromium browser it launches. 

> Note: this does not apply if the browser is launched independently and taiko is made to connect to the already running browser instance.

### ---no-sandbox
Lighthouse-ci has documented chrome sandboxing and nuances with docker here - [--No-sandbox Issues are explained](https://github.com/GoogleChrome/lighthouse-ci/blob/master/docs/recipes/docker-client/README.md#--no-sandbox-issues-explained) -
“Chrome uses sandboxing to isolate renderer processes and restrict their capabilities. If a rogue website is able to discover a browser vulnerability and break out of JavaScript engine for example, they would find themselves in a very limited process that can't write to the filesystem, make network requests, mess with devices, etc.”

There are several options to run chrome headless in docker. Puppeteer has [a couple of recommendations](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#setting-up-chrome-linux-sandbox).

According to [Lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci/blob/master/docs/recipes/docker-client/README.md#--no-sandbox-container-tradeoffs), passing `--no-sandbox` may not be a bad option. The same applies to Taiko as well. Note that several options (other than passing `--no-sandbox` to chrome) require permissions/changes that apply to the entire container. 

### --start-maximized
Modern websites are often built to be responsive. To ensure that the browser opens in full view-port use `--start-maximized` flag. Alternatively, set `--window-size` flag to open the website in specific viewport size.

> Note: Taiko’s [setViewPort()](https://docs.taiko.dev/api/setviewport/) api may also be used to set/switch viewport in the code.

### --disable-dev-shm
“By default, Docker runs a container with a /dev/shm shared memory space 64MB. This is [typically too small](https://github.com/c0b/chrome-in-docker/issues/1) for Chrome and will cause Chrome to crash when rendering large pages. To fix, run the container with docker run --shm-size=1gb to increase the size of /dev/shm. Since Chrome 65, this is no longer necessary. Instead, launch the browser with the --disable-dev-shm-usage flag:” - [Puppeteer troubleshooting tips](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#tips)

## Project code in docker
The project code can be made available on the docker using various methods (besides adding it to the container at build time).

[Docker cp](https://docs.docker.com/engine/reference/commandline/cp/)
[Git clone](https://git-scm.com/docs/git-clone)
[Volume mounting](https://docs.docker.com/storage/volumes/) the entire project will mount the node_modules as well. Node_modules can have OS specific files which also get mounted on to the docker. If the docker is running for a different OS configuration, this will give errors unless node_modules is deleted before mounting. 