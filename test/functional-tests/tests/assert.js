/* global date */

const assert = require('assert');
var { getElements } = require('./selectors');

const { title, text, textBox, toLeftOf, evaluate } = require('taiko');

step('Assert title to be <userTitle>', async function(userTitle) {
  assert.ok((await title()).includes(userTitle));
});

step('Assert Exists <table>', async function(table) {
  for (const element of getElements(table)) {
    assert.ok(await element.exists());
  }
});

step('assert text should be empty into <table>', async function(table) {
  for (const element of getElements(table)) {
    assert.equal(await element.text(), '');
  }
});

step('Assert text <content> exists on the page.', async function(content) {
  assert.ok(await text(content).exists());
});

step('Assert text <content> does not exist', async function(content) {
  assert.ok(!(await text(content).exists()));
});

step('Assert text <expectedText> exists on the textArea. <table>', async function(
  expectedText,
  table,
) {
  for (const element of getElements(table)) {
    var actualText = await textBox(toLeftOf(element)).value();
    assert.equal(actualText, expectedText.trim());
  }
});

step('Assert page has set timezome', async function() {
  const getTime = await evaluate(() => {
    return date.toString();
  });
  assert.equal(getTime, 'Sat Nov 19 2016 13:12:34 GMT-0500 (Eastern Standard Time)');
});
