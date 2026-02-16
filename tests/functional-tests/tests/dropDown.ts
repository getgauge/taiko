const assert = require("node:assert");
import { getElements } from "./selectors";

import { Step, type Table } from "gauge-ts";
import { dropDown, near } from "taiko";

export default class DropDown {
  @Step("Select <value> of Combo Box near <table>")
  public async function(value: string, table: Table) {
    for (const element of getElements(table)) {
      assert.ok(await element.exists());
      await dropDown(near(element, { offset: 50 })).select(value);
    }
  }
}
