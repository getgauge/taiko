var _selectors = require('./selectors');
const assert = require('assert');
const {
  scrollTo,
  scrollUp,
  press,
  hover,
  dragAndDrop,
  $,
  currentURL
} = require('../../../lib/taiko');
var URL = require('url').URL;

step('Scroll to <table>', async function(table) {
  await scrollTo(_selectors.getElement(table));
});

step('Scroll up <table>', async function(table) {
  await scrollUp(_selectors.getElement(table));
});

step('Press <key>', async function(key) {
  await press(key);
});

step('Hover on element <table>', async function(table) {
  await hover(_selectors.getElement(table));
});

step('Drag <source> and drop to <destination>', async function(
  source,
  destination
) {
  assert.equal(4, (await $('.document').get()).length);
  await dragAndDrop($(source), $(destination));
  assert.equal(3, (await $('.document').get()).length);
});

step('Drag <source> and drop at <directionTable>', async function(
  source,
  directionTable
) {
  assert.equal(3, (await $('.document').get()).length);
  const direction = {};
  directionTable.rows.forEach(row => {
    direction[row.cells[0]] = parseInt(row.cells[1]);
  });
  await dragAndDrop($(source), direction);
  assert.equal(2, (await $('.document').get()).length);
});

step('Assert url host is <hostName>', async function(hostName) {
  const url = await currentURL();
  assert.equal(new URL(url).hostname, hostName);
});

step('Assert page navigated back', async function() {
  const url = await currentURL();
  assert.equal(new URL(url).hostname, 'the-internet.herokuapp.com');
});

step('Assert page navigated forward', async function() {
  const url = await currentURL();
  assert.equal(new URL(url).pathname, '/checkboxes');
});

step("Validate part of current url <partOfURL> after redirecting", async function (partOfURL) {
	var urlValue = await currentURL();
	await assert.ok(urlValue.includes(partOfURL));
});