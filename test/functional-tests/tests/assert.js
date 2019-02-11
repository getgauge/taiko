const assert = require('assert');
var _selectors = require('./selectors');

const { title, text } = require('../../../lib/taiko');

step('Assert title to be <userTitle>', async function(userTitle) {
  assert.ok((await title()).includes(userTitle));
});

step('Assert Exists <table>', async function(table) {
  assert.ok(await _selectors.getElement(table).exists());
});

step('assert text to be <text> <table>', async function(text, table) {
  assert.equal((await _selectors.getElement(table).text())[0], text);
});

step('Assert text is not empty <table>', async function(table) {
  assert.ok((await _selectors.getElement(table).text()) != '');
});

step('Assert text <content> exists on the page.', async function(content) {
  assert.ok(await text(content).exists());
});

step('Assert text <content> does not exist', async function(content) {
  assert.ok(!(await text(content).exists()));
});
