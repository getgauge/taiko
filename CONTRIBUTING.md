## Contributing to Taiko

Contributions to Taiko are welcome and appreciated. Coding is definitely not the only way you can contribute to Taiko. There are many valuable ways to contribute to the product and to help the growing Taiko community.

Please read this document to understand the process for contributing.

## Different ways to contribute

* You can [report an issue](https://github.com/getgauge/taiko/issues) you found
* Help us [test Taiko](https://github.com/getgauge/taiko/tree/master/test/functional-tests) by adding to our existing automated tests
* Help someone get started with Taiko on [our discussion forum](https://groups.google.com/forum/#!forum/getgauge)
* Contribute [to our blog](https://gauge.org/blog/)
* Add to our [set of examples](https://github.com/getgauge/taiko/tree/master/examples) to help someone new to Taiko get started easily
* Help us improve [our documentation](https://taiko.gauge.org/)
* Contribute code to Taiko! 

All repositories are hosted on GitHub. Taiko’s core is written in pure Javascript. Pick up any pending feature or bug, big or small, then send us a pull request. Even fixing broken links is a big, big help!

## How do I start contributing

There are issues of varying levels across all Taiko repositories. All issues that need to be addressed are tagged as _'Help Needed'_. One easy way to get started is to pick a small bug to fix. These have been tagged as _'Easy Picks'_.

If you need help in getting started with contribution, feel free to reach out on the [Google Groups](https://groups.google.com/forum/#!forum/getgauge) or [Gitter](https://gitter.im/getgauge/chat).

If your contribution is a code contribution and you do send us a pull request, you will first need to read and sign the [Contributor License Agreement](https://gauge-bot.herokuapp.com/cla/).

## Setting the project and debugging a functionality in Visual Studio Code.

1. Download the project locally. (Ofcourse.)
2. Set the debug points in the taiko.js (or any required file)
3. Open the debug Tab in VS Code (Left most Vertical Menu)
4. From the configurations to run, choose 'Program'.
5. Click on Run. 
- The debugger has now been started. But where to fire the commands?-
1. Open the debug console.
2. Import taiko there `const taiko = require('/Users/*/taiko/lib/taiko')`
3. Start firing the commands. eg `taiko.openBrowser()`
- If you have put the debug point in the underlying code, it should break there'
