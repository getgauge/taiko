var _selectors = require('./selectors')
const assert = require('assert');
const {
    scrollTo,scrollUp,press,highlight,hover,dragAndDrop,$
} = require('taiko');

step("Scroll to <table>", async function(table) {
	await scrollTo(_selectors.getElement(table));
});

step("Scroll up <table>", async function(table) {
	await scrollUp(_selectors.getElement(table));
});

step("Press <key>", async function(key) {
	await press(key);
});

step("Highlight <selector>",async function(selector){
	await highlight(selector);
});

step("Hover on element <table>", async function(table) {
	await hover(_selectors.getElement(table))
});

step("Drag <source> and drop to <destination>", async function(source, destination) {
	assert.equal(4,(await $('.document').get()).length);
	await dragAndDrop($(source),$(destination));
	assert.equal(3,(await $('.document').get()).length);
});

step("Drag <source> and drop at <directionTable>", async function(source, directionTable) {
	assert.equal(3,(await $('.document').get()).length);
	const direction = {};
	directionTable.rows.forEach(row => {
		direction[row.cells[0]] = parseInt(row.cells[1]);
	});
	await dragAndDrop($(source),direction);
	assert.equal(2,(await $('.document').get()).length);
});