---
layout: page.njk
---

Taiko is always open to contributions both big and small. This document explains 
how you can contribute.

> Contributors and users are obliged to follow the Taiko's [Code of Conduct](https://github.com/getgauge/taiko/blob/master/CODE_OF_CONDUCT.md). The [core team](https://github.com/orgs/getgauge/teams/core) will apply the code of conduct whenever a user
or contributor violates any of the terms. Please do take some time to read and understand the terms before participating on 
Taiko forums, issue tracker or sending pull requests. 

## Reporting an issue

Taiko's [automated test suite](https://github.com/getgauge/taiko/tree/master/test) runs on every commit. Despite best efforts, bugs happen. As a first step make sure the issue/bug wasn't reported earlier. You can start by searching

* [Google](google)! We trust you already did, but in case you haven't.
* Previous issues with the error message on [Github](https://github.com/getgauge/taiko/issues)
* Similar questions on Taiko's [Discussions](https://github.com/getgauge/taiko/discussions) 

If you find a similar bug or issue please add a comment to the existing issue on Github or
thread on [Discussions](https://github.com/getgauge/taiko/discussions).

If you do not find anything and you are sure it's a bug please create a [new issue](https://github.com/getgauge/taiko/issues). To make it easier to debug and fix the issue make sure your report

* Has a clear title
* Fills all sections of the [default template](https://github.com/getgauge/taiko/blob/master/.github/issue_template.md) (The sections will be available whenever you create a new issue). 

The issue template has a section with instructions on how to report versions of
Taiko, Node, OS and Gauge (if you are using it). **Please do not ignore this section**. 

To work efficiently, the project team might close an issue without enough information. But, don't
worry if your issue is closed, it will be re-opened as soon as there is more information. 

Here are a few well reported issues [1477](https://github.com/getgauge/taiko/issues/1477), [1442](https://github.com/getgauge/taiko/issues/1442), [1552](https://github.com/getgauge/taiko/issues/1552).

## Adding examples

Taiko has a list of examples on [Github](https://github.com/getgauge/taiko/tree/master/examples). 
The examples test a sample application called [the internet express](https://github.com/getgauge-contrib/the-internet-express). You can write test scripts for this application or create a self contained working example. 

Please note, examples you submit should not be testing an external website as they are tested on 
every pull request and this may result in unwanted traffic to the website.

## Improving documentation

Source for Taiko's [documentation](https://docs.taiko.dev) is available on [Github](https://github.com/getgauge/taiko/tree/master/docs). The [API](https://github.com/getgauge/taiko/blob/f98acd6f70ae5c3ad76097455e3f78a9ec461d55/lib/taiko.js#L255) documentation uses [JSDoc](https://github.com/documentationjs/documentation/blob/master/docs/GETTING_STARTED.md#the-essentials). 

Please raise a [pull request](https://docs.github.com/en/free-pro-team@latest/github/collaborating-with-issues-and-pull-requests/about-pull-requests) if you want to improve any part of the documentation. A link to a preview site with the changes 
you made on the pull request will be available under the "All checks have passed" section of the pull request.

## Answering queries

You can help by answering queries by users who are getting started on Taiko or looking for ways to solve specific 
test automation tasks on [Discussions](https://github.com/getgauge/taiko/discussions).

You can also comment on [issues](https://github.com/getgauge/taiko/issues) raised by users. 
To get notified of new issues make sure you are [watching](https://docs.github.com/en/free-pro-team@latest/github/getting-started-with-github/be-social#watching-a-repository) the repository.

## Talking/Writing about Taiko

If you feel Taiko can help others in their test automation consider talking about Taiko to your testing community or at other meetups. 

Taiko has great videos on [YouTube](https://www.youtube.com/results?search_query=taiko+testing) created by all kinds of users and there is always scope for more. 

You can also write about Taiko on Gauge's [blog page](https://github.com/getgauge/gauge.org/tree/master/source/posts). If you have an idea please create [Github issue ](https://github.com/getgauge/gauge.org/issues) detailing your idea to discuss the post.

To share your talk or post about Taiko please tweet [@taikodev](https://twitter.com/taikodev). For logos and images please refer Taiko's [brand page](https://brand.taiko.dev)

## Writing plugins

Taiko's [plugin](https://github.com/getgauge/taiko/wiki/Taiko-Plugin) architecture, allows you to 
extend Taiko's functionality. It is also a way to experiment with ideas which could be a part of the
core. 

You can refer the current list of [plugins](https://docs.taiko.dev/plugins/) to build your own. If you
want your plugin to be listed on the [plugins](https://docs.taiko.dev/plugins/) page please modify the
[list](https://github.com/getgauge/taiko/blob/master/docs/plugins.md) and send a pull request. 

## Contribute code and pull requests to Taiko! 

Taiko is a [Node.js](https://nodejs.org/en/) library written in Javascript (with Typescript bindings). You only need 
the latest version of Node.js and git installed to clone the [repository](https://github.com/getgauge/taiko)
and get started.

There are issues of varying levels across all Taiko repositories. All issues that 
need to be addressed are tagged as [help wanted](https://github.com/getgauge/taiko/labels/help%20wanted). 

One easy way to get started is to pick a small bug to fix. 
These have been tagged as [good first issue](https://github.com/getgauge/taiko/labels/good%20first%20issue).

To everyone is working on, what's on the roadmap and what's priority please check the
[project board](https://github.com/orgs/getgauge/projects/6?card_filter_query=repo%3Agetgauge%2Ftaiko).

If want to contribute something new it's better to discuss it before working on it. You 
can discuss new ideas and features by creating a new issue on Github. You can also reach 
out on [Discussions](https://github.com/getgauge/taiko/discussions?discussions_q=category%3AIdeas).

Once you pick an issue, add a comment informing that you want to work on it. To get 
early feedback from other contributors, it's recommended that you first raise a [draft pull 
request](https://docs.github.com/en/free-pro-team@latest/github/collaborating-with-issues-and-pull-requests/about-pull-requests#draft-pull-requests) with a small commit with a pull request title and description. Keep making
incremental commits to this pull request and seek out help or reviews till it's complete.

Taiko depends a lot on it's testing suite to check every PR and make frequent releases. If you are adding new feature please try you best to add a test.

### Signing commits

All commits to Taiko and related repositories require DCO signing. By adding a `Signed-off-by` 
line to your commit, you sign off the [Developer Certificate of Origin](https://developercertificate.org/). 

You can use the `-s` flag to your `git commit` command. To add this line. If you want to automate even this flag addition, you can use [git commit templates](https://git-scm.com/docs/git-commit#Documentation/git-commit.txt---templateltfilegt) which 
automatically certifies all your future commits by default.

### Bumping version of taiko

Any pull request tagged with the label [ReleaseCandidate](https://github.com/getgauge/taiko/pulls?q=is%3Apr+label%3AReleaseCandidate+)
will trigger a release on merge and must add a commit bumping up the version of the release.

For bumping patch version run

    npm version patch --no-git-tag-version

For bumping minor version run

    npm version minor --no-git-tag-version

For bumping major version run

    npm version major --no-git-tag-version

This will update the version accordingly in the `package.json`. 
