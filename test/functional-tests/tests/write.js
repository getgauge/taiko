const {
    write,focus,clear
} = require('taiko');
var _selectors = require('./selectors')

step("Write <text>", async function(text) {
	return write(text)
});

step("Focus <table>", async function(table) {
	return await focus(_selectors.getElement(table))
});

step("Clear element that is in focus", async function() {
	return await clear()
});