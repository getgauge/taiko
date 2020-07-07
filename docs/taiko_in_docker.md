---
layout: page.njk
---

To run Taiko in a docker container follow these instructions.

## Installing


    docker pull node

Start a container

    docker run -it node /bin/bash

Update packages

    apt-get update

Install chromium dependencies

    apt-get install -y wget unzip fontconfig locales gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils

Install Taiko

    npm install taiko -g --allow-root --unsafe-perm=true

Note: These instructions should ideally be a part of the `Dockerfile` while
building a docker image.

## Running

To launch taiko in headless mode start taiko REPL with taiko and open browser with below arguments:

    await openBrowser({headless: true, args: ['--no-sandbox']});

To launch taiko in headful mode install Xvfb

    apt-get install xvfb

Start taiko REPL with xvfb-run taiko and open browser with below arguments:

    await openBrowser({headless: false, args: ['--no-sandbox']});