## Frequently Asked Questions

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
