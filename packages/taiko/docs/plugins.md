---
layout: page.njk
---

## Plugins by the community

* [taiko-accessibility](https://github.com/andreas-ku/taiko-accessibility) A plugin to test the 
site accessibility with Taiko
* [taiko-android](https://github.com/saikrishna321/taiko-android) A plugin to run web tests on 
android devices and emulator using Taiko.
* [taiko-diagnostics](https://github.com/saikrishna321/taiko-diagnostics) A plugin for taiko which 
provides some diagnostics features like measuring speedindex, performance metrics of webpage.
* [taiko-screencast](https://github.com/getgauge-contrib/taiko-screencast) A plugin to record a 
gif video of a taiko script run.
* [taiko-storage](https://github.com/BugDiver/taiko-storage) A taiko plugin to interact with browser storages.
* [taiko-screeny](https://github.com/saikrishna321/taiko-screeny) A taiko plugin to capture screenshot on every action.
* [taiko-video](https://github.com/hkang1/taiko-video) A taiko plugin to save screencast as compressed mp4 videos.

If you've [written your own plugin](/writing_plugins) send a pull request to list it here. 

## Using plugins with runners

To load plugins and use them with a runner like [Gauge](https://gauge.org), you need to 

* Install the plugin into the project for example 
```
npm install taiko-diagnostics
```
* Set the [`TAIKO_PLUGIN`](https://docs.taiko.dev/configuring_taiko/#using-environment-variables) 
environment variable before running the tests. For example in bash or zsh you can do this as follows

```
TAIKO_PLUGIN=diagnostics gauge run specs
```
