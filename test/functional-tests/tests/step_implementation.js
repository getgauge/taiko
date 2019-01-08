'use strict';
const assert = require('assert');
var _path = require('path');
const {
    browser, page, openBrowser, closeBrowser, goto, reload, $, link, listItem,
    inputField, fileField, textField, image, button, comboBox, checkBox, radioButton, alert,
    prompt, confirm, beforeunload, text, click, doubleClick, rightClick, write, press,
    attach, highlight, focus, scrollTo, scrollRight, scrollLeft, scrollUp, scrollDown,
    hover, screenshot, timeoutSecs, intervalSecs, waitForNavigation, to, into, dismiss, accept,intercept
} = require('taiko');

beforeScenario(async() => await openBrowser({args: [ 
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote']}
));

gauge.screenshotFn = async function () {
    return await screenshot({encoding: "base64"});
};

afterScenario(async() => await closeBrowser());

step('Navigate to <url>', async url => 
{
    await goto(url)
});

step('Navigate to <url> with timeout <timeout> ms', async (url,timeout) => await goto(url,{timeout:timeout}));

step('Display the Gauge logo', async() => assert.ok(await link('Gauge').exists()));

step('Go to Gauge get started page', async() => await click('Get Started'));

step("Click on Quick Install", async () => assert.ok(await click('Quick Install')));

step("Check <heading> exists", async (heading) => assert.ok(await text(heading).exists()));

step('Go to Gauge documentation page', async() => await click($(`//*[text()='Documentation']`)));

step('Display quick start', async() => assert.ok(await text('quick start').exists()));

step('Go to plugins page', async() => {
    assert.ok(await link('Get Started').exists());
    assert.ok(await link(text('Get Started')).exists());
    assert.ok(await $(`//a[contains(text(),'Get Started')]`).exists());

    await hover('Get Started');
    await click('Plugins');
});

step('Display the language plugins', async() => {
    assert.ok(await text('Plugins').exists(intervalSecs(1), timeoutSecs(10)));

    assert.ok(await text('Java Runner').exists());
    await highlight(text('Java Runner'));

    assert.ok(await text('Ruby runner').exists());
});

step('Search for Hooks', async() => {
    const field = inputField({'placeholder': 'Search Docs'});
    await write('Hooks', into(field),{delay:100});
    assert.equal(await field.value(), 'Hooks');
    await press('Enter');
    assert.ok(await link('CSharp').exists());
});

step('Click on IDE plugins', async() => {
    assert.ok(await listItem('IDE Plugins').exists());
    assert.ok(await click('IDE Plugins'));
});

step('Display the IDE plugins', async() => {
    assert.ok(await link('IntelliJ').exists());
    assert.ok(await link('Visual Studio Code').exists());
});

step('Combo Box', async() => {
    const box = comboBox('Cars');
    assert.ok(await box.exists());
    await box.select('Saab');
    assert.equal(await box.value(), 'saab');
});

step('Check Box', async() => {
    const box = checkBox('Vehicle');
    assert.ok(await box.exists());
    await checkBox('Vehicle').check();
    assert.ok(await box.isChecked());
});

step("Radio Button <label>", async (label) => {
    const button = radioButton(label);
    assert.ok(await button.exists());
    await button.select();
    assert.ok(await button.isSelected());
});

step('Attach file', async() => {
    const field = fileField('File');
    await attach('file.txt', to(field));
    assert.ok((await field.value()).endsWith('file.txt'));
});

step('Should be able to get value <text> of text field <textFieldName>', async(text,textFieldName) => {
    const field = textField(textFieldName);
    assert.equal(await field.value(), text);
});

step('An existing text field <textFieldName> value should give exists true', async(textFieldName) => {
    const field = textField(textFieldName);
    assert.ok(await field.exists());
});

step('Should be able to write <text> on Text Field <textFieldName>', async(text,textFieldName) => {
    await write(text, into(textFieldName));
});

step('Should be able to focus on Text Field <textFieldName>', async(textFieldName) => {
    await focus(textFieldName);
});

step("Scroll the page right by pixels <pixels>", async (pixels) => {
    await scrollRight(pixels);
});

step('Scroll element <element> right by pixels <pixels>', async(element,pixels) => {
    await scrollRight($(element), pixels);
});

step('Scroll the page left',async() =>{
    await scrollLeft();
})

step("Wait for Accept message <message> on click of button <buttonName>", async (message, buttonName) => {
    alert(message, async () => await accept());

    await click(button(buttonName));
});

step("Wait for dismiss message <message> on click of button <buttonName>", async (message, buttonName) => {
    alert(message, async () => await dismiss());

    await click(button(buttonName));
});

step("Intercept Google Analytics", async function() {
	await intercept("https://www.googletagmanager.com/gtm.js?id=GTM-5C33ML2");
    await intercept("https://www.google-analytics.com/analytics.js");
});

step("Respond to <url> with <respomnseBody>", async function(url, respomnseBody) {
	await intercept(url, {body: respomnseBody })
});

step("Respond to <url> with json <jsonString>", async function(url, jsonString) {
	await intercept(url, {body: JSON.parse(jsonString) })
});

step("Navigate to relative path <relativePath>", async function(relativePath) {
    var absolutePath = _path.resolve(relativePath)
    await goto("file:///"+absolutePath)
});

step("Scroll to element <arg0>", async function(arg0) {
    await scrollTo($('#myDIV'));
});

step("Scroll the page left by pixels <pixels>", async (pixels) => {
    await scrollLeft(pixels);
});

step("Scroll element <element> left by pixels <pixels>", async function(element, pixels) {
    await scrollLeft($(element), pixels);
});

step('Scroll the page right',async() =>{
    await scrollRight();
})

step("Scroll the page up by pixels <pixels>", async (pixels) => {
    await scrollUp(pixels);
});

step("Scroll element <element> up by pixels <pixels>", async function(element, pixels) {
    await scrollUp($(element), pixels);
});

step('Scroll the page up',async() =>{
    await scrollUp();
})

step("Scroll the page down by pixels <pixels>", async (pixels) => {
    await scrollDown(pixels);
});

step("Scroll element <element> down by pixels <pixels>", async function(element, pixels) {
    await scrollDown($(element), pixels);
});

step('Scroll the page down',async() =>{
    await scrollDown();
})
