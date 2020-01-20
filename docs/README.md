## Build

The documentation for Taiko website is generated from comments in source code
and template files using [documentation.js](https://documentation.js.org).

To build documentation run the following command in this folder

```
npm run doc
```

To view documentation open `site/index.html` in a browser.

## Folder structure

To change the look and feel or add other documentation modify the
following files.

```
├── layout                      
│   ├── assets
│   │   ├── css                 | Styles for the website 
│   │   ├── images              | Images for the website
│   │   ├── js                  | Javascript for website and search
│   │   └── tmpl                | Template files for search
│   ├── page.html               | Main page that combines partials
│   └── partials
│       ├── content.html        | Generated API documentation
│       ├── header.html         | Intro, install etc
│       ├── navbar.html         | Side navigation bar
│       ├── toc.html            | Side table of contents
│       └── troubleshoot.html   | Trouble shooting guide content
```

## API documentation format

```
/**
 * Opens the specified URL in the browser's tab. Adds `http` protocol to the URL if not present.
 * @example
 * await goto('https://google.com')
 * await goto('google.com')
 * await goto({ navigationTimeout:10000, headers:{'Authorization':'Basic cG9zdG1hbjpwYXNzd29y2A=='}})
 *
 * @param {string} url - URL to navigate page to.
 * @param {Object} options
 * @param {boolean} [options.waitForNavigation=true] - Wait for navigation after the goto. Default navigationTimeout is 30 seconds to override pass `{ navigationTimeout: 10000 }` in `options` parameter.
 * @param {string[]} [options.waitForEvents = ['firstMeaningfulPaint']] - Events available to wait for ['DOMContentLoaded', 'loadEventFired', 'networkAlmostIdle', 'networkIdle', 'firstPaint', 'firstContentfulPaint', 'firstMeaningfulPaint']
 * @param {number} [options.navigationTimeout=30000] - Navigation timeout value in milliseconds for navigation after click.
 * @param {Object} options.headers - Map with extra HTTP headers.
 * @param {number} [options.waitForStart = 100] - time to wait for navigation to start. Accepts value in milliseconds.
 *
 * @returns {Promise}
 */
module.exports.goto = async (
    ....
};
```