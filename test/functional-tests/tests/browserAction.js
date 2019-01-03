const {
    switchTo,openTab,closeTab,reload,goto
} = require('taiko');
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