const {
    write,focus
} = require('taiko');
var _selectors = require('./selectors')

step("Write <text>", async function(text) {
	return write(text)
});

step("Focus <table>", async function(table) {
	return await focus(_selectors.getElement(table))
});