const {
    switchTo,openTab,closeTab,reload,goto, getCookies
} = require('../../../lib/taiko');
const assert = require('assert');
const cwd = process.cwd();

step("Switch to tab with title <title>",async function(title){
	await switchTo(title);
});

step("Open Tab <url>", async function(url) {
	await openTab(url);
});

step("Close Tab <url>", async function(url) {
	await closeTab(url);
});

step("Open Tab <arg0> with timeout <time>", async function(url, time) {
	await openTab(url,{timeout:time});
});

step("Close Tab", async function() {
	await closeTab()
});

step("Reload the page", async function() {
	await reload();
});

step("Navigate to file with relative Path <filePath>", async function(filePath) {
	await goto("file:///"+cwd+filePath)
});

step("Assert cookies to be present", async function() {
	const cookies = await getCookies();
	assert.ok(cookies.length > 0);

});

step("Assert cookie with valid options url <arg>", async function(arg) {
	const cookies = await getCookies({urls: [arg]});
	assert.ok(cookies.length > 0);
});

step("Assert cookie with invalid options url <arg>", async function(arg) {
	const cookies = await getCookies({urls: [arg]});
	assert.ok(cookies.length === 0);
});