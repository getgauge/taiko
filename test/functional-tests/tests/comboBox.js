'use strict';
const assert = require('assert');
var _selectors = require('./selectors');

const { comboBox, near } = require('../../../lib/taiko');

step('Select <value> of Combo Box near <table>', async function(value, table) {
  var element = _selectors.getElement(table);
  assert.ok(await element.exists());
  await comboBox(near(element, { offset: 50 })).select('‪हिन्दी‬');
});

