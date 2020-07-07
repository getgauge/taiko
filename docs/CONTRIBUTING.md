---
layout: page.njk
---
## Contributing to Taiko

Contributions to Taiko are welcome and appreciated. Coding is definitely 
not the only way you can contribute to Taiko. There are many valuable ways 
to contribute to the product and to help the growing Taiko community.

Please read this document to understand the process for contributing.

## Different ways to contribute

* You can [report an issue](https://github.com/getgauge/taiko/issues) you found
* Help us [test Taiko](https://github.com/getgauge/taiko/tree/master/test/functional-tests) by adding to our existing automated tests
* Help someone get started with Taiko on [our discussion forum](https://spectrum.chat/taiko)
* Add to our [set of examples](https://github.com/getgauge/taiko/tree/master/examples) to help someone new to Taiko get started easily
* Help us improve [our documentation](https://taiko.dev/)
* Contribute code to Taiko! 

All repositories are hosted on GitHub. Taiko’s core is written in pure Javascript. 
Pick up any pending feature or bug, big or small, then send us a pull request. 
Even fixing broken links is a big, big help!

## How do I start contributing

There are issues of varying levels across all Taiko repositories. All issues that 
need to be addressed are tagged as [help wanted](https://github.com/getgauge/taiko/labels/help%20wanted). 
One easy way to get started is to pick a small bug to fix. 
These have been tagged as [good first issue](https://github.com/getgauge/taiko/labels/good%20first%20issue).

Once you pick an issue, add a comment informing that you want to work on it. To get 
early feedback from other contributors, it's recommended that you first raise a pull 
request with a small commit by prefixing "WIP" to the pull request title. Keep making
incremental commits to this pull request and seek out help or reviews till it's complete.

You can also reach out on [Spectrum](https://spectrum.chat/taiko).

If your contribution is a code contribution and you do send us a pull request, please 
sign all your commits using git.

## Bumping version of taiko

For bumping patch version run

    npm version patch --no-git-tag-version

For bumping minor version run

    npm version minor --no-git-tag-version

For bumping major version run

    npm version major --no-git-tag-version

This will update the version accordingly in the `package.json`. 
Make sure to add and commit the changes.
