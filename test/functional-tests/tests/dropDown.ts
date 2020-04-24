'use strict';
const assert = require('assert');
import { getElements } from './selectors';

import { dropDown, near } from 'taiko';
import { Step } from 'gauge-ts';

export default class DropDown {
  @Step('Select <value> of Combo Box near <table>')
  public async function(value, table) {
    for (const element of getElements(table)) {
      assert.ok(await element.exists());
      await dropDown(near(element, { offset: 50 })).select(value);
    }
  }
}
