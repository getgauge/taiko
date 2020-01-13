'use strict';
const assert = require('assert');
var { getElements } = require('./selectors');

const { dropDown, near } = require('taiko');

step('Select <value> of Combo Box near <table>', async function(value, table) {
  for (const element of getElements(table)) {
    assert.ok(await element.exists());
    await dropDown(near(element, { offset: 50 })).select(value);
  }
});
