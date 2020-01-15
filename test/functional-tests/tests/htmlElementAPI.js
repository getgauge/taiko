'use strict';
const assert = require('assert');
var _path = require('path');
const {
  goto,
  $,
  fileField,
  textBox,
  button,
  dropDown,
  checkBox,
  radioButton,
  alert,
  click,
  write,
  attach,
  focus,
  scrollTo,
  scrollRight,
  scrollLeft,
  scrollUp,
  scrollDown,
  to,
  into,
  dismiss,
  accept,
  intercept,
  toRightOf,
  clearIntercept,
} = require('taiko');

step('Navigate to <url>', async url => {
  await goto(url);
});

step('Ensure Drop down <dropDownName> exists', async dropDownName => {
  const box = dropDown(dropDownName);
  assert.ok(await box.exists());
});

step(
  'Select <value> of Drop down <dropDownName>. The value now should be <fieldValue>',
  async (value, dropDownName, fieldValue) => {
    const box = dropDown(dropDownName);
    await box.select(value);
    assert.equal(await box.value(), fieldValue);
  },
);

step('Ensure Check Box <checkBoxName> exists', async checkBoxName => {
  const box = checkBox(checkBoxName);
  assert.ok(await box.exists());
});
step('Check the value of Check Box <checkBoxName>', async checkBoxName => {
  const box = checkBox(checkBoxName);
  await box.check();
  assert.ok(await box.isChecked());
});

step('Radio Button <label>', async label => {
  const button = radioButton(label);
  assert.ok(await button.exists());
  await button.select();
  assert.ok(await button.isSelected());
});

step('Attach file <fileName> to file field <FileFieldName>', async (fileName, FileFieldName) => {
  const field = fileField(FileFieldName);
  await attach(fileName, to(field));
  assert.ok((await field.value()).endsWith(fileName));
});

step('Get value <text> of Text Box <textBoxName>', async (text, textBoxName) => {
  const field = textBox(textBoxName);
  assert.equal(await field.value(), text);
});

step('An existing Text Box <textBoxName> value should give exists true', async textBoxName => {
  const field = textBox(textBoxName);
  assert.ok(await field.exists());
});

step('Write <text> into Text Box <textBoxName>', async (text, textBoxName) => {
  await write(text, into(textBoxName));
});

step('Write <text> into TextBox with name <textboxName>', async function(text, textBoxName) {
  await write(text, into(textBox({ name: textBoxName })));
});

step('Write <text> to Text Box <textBoxName>', async (text, textBoxName) => {
  await write(text, to(textBoxName));
});

step('Focus on Text Box to right of <textBoxName>', async textBoxName => {
  await focus(textBox(toRightOf(textBoxName)));
});

step('Scroll the page right by pixels <pixels>', { continueOnFailure: true }, async pixels => {
  await scrollRight(parseInt(pixels, 10));
});

step(
  'Scroll element <element> right by pixels <pixels>',
  { continueOnFailure: true },
  async (element, pixels) => {
    await scrollRight($(element), parseInt(pixels, 10));
  },
);

step('Scroll the page left', { continueOnFailure: true }, async () => {
  await scrollLeft();
});

step(
  'Wait for Accept message <message> on click of button <buttonName>',
  async (message, buttonName) => {
    alert(message, async () => await accept());

    await click(button(buttonName));
  },
);

step(
  'Wait for dismiss message <message> on click of button <buttonName>',
  async (message, buttonName) => {
    alert(message, async () => await dismiss());

    await click(button(buttonName));
  },
);

step('Respond to <url> with <responseBody>', async function(url, responseBody) {
  await intercept(url, { body: responseBody });
});

step('Respond to <url> with json <jsonString>', async function(url, jsonString) {
  await intercept(url, { body: JSON.parse(jsonString) });
});

step('Navigate to relative path <relativePath>', async function(relativePath) {
  var absolutePath = _path.resolve(relativePath);
  await goto('file:///' + absolutePath);
});

step('Scroll to element <arg0>', { continueOnFailure: true }, async function() {
  await scrollTo($('#myDIV'));
});

step('Scroll the page left by pixels <pixels>', { continueOnFailure: true }, async pixels => {
  await scrollLeft(parseInt(pixels, 10));
});

step(
  'Scroll element <element> left by pixels <pixels>',
  { continueOnFailure: true },
  async function(element, pixels) {
    await scrollLeft($(element), parseInt(pixels, 10));
  },
);

step('Scroll the page right', { continueOnFailure: true }, async () => {
  await scrollRight();
});

step('Scroll the page up by pixels <pixels>', { continueOnFailure: true }, async pixels => {
  await scrollUp(parseInt(pixels, 10));
});

step('Scroll element <element> up by pixels <pixels>', { continueOnFailure: true }, async function(
  element,
  pixels,
) {
  await scrollUp($(element), parseInt(pixels, 10));
});

step('Scroll the page up', { continueOnFailure: true }, async () => {
  await scrollUp();
});

step('Scroll the page down by pixels <pixels>', { continueOnFailure: true }, async pixels => {
  await scrollDown(parseInt(pixels, 10));
});

step(
  'Scroll element <element> down by pixels <pixels>',
  { continueOnFailure: true },
  async function(element, pixels) {
    await scrollDown($(element), parseInt(pixels, 10));
  },
);

step('Scroll the page down', { continueOnFailure: true }, async () => {
  await scrollDown();
});

step('Navigate to relative path <path> with timeout <timeout> ms', async function(path, timeout) {
  var absolutePath = _path.resolve(path);
  await goto('file:///' + absolutePath, {
    navigationTimeout: timeout,
  });
});

step('Navigate to <url> with timeout <timeout> ms', async function(url, timeout) {
  await goto(url, { navigationTimeout: timeout });
});

step('Reset intercept for <url>', function(url) {
  clearIntercept(url);
});

step('Reset all intercept', function() {
  clearIntercept();
});
