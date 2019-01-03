var _selectors = require('./selectors')
var assert = require('assert')

step("length of parse int should be <elementLength> <table>", async function (elementLength, table) {
    var elementText = await _selectors.getElement(table).text()
	assert.ok(elementText.length>=elementLength)
});