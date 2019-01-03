'use strict';
var _selectors = require('./selectors')
const {
    click,checkBox,near
} = require('taiko');
step("Click checkBox with attribute <jsonAttribute> near <table>", async function(jsonAttribute, table) {
	await click(checkBox(JSON.parse(jsonAttribute),near(_selectors.getElement(table))))
});