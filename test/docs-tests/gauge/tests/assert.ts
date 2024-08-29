const assert = require("node:assert");
import { Step, type Table } from "gauge-ts";
import { below, evaluate, text, textBox, title, toLeftOf } from "taiko";
import { getElements } from "./selectors";

export default class Assert {
  @Step("Assert title to be <userTitle>")
  public async assertTitle(userTitle: string) {
    assert.ok((await title()).includes(userTitle));
  }

  @Step("Assert Exists <table>")
  public async assertExists(table: Table) {
    for (const element of getElements(table)) {
      assert.ok(await element.exists());
    }
  }

  @Step("assert text should be empty into <table>")
  public async assertTextToBeEmpty(table: Table) {
    for (const element of getElements(table)) {
      assert.equal(await element.text(), "");
    }
  }

  @Step("Assert text <content> exists on the page.")
  public async assertTextExists(content: string) {
    assert.ok(await text(content).exists());
  }
  @Step("Assert text <lowerContent> exists below <upperContent>.")
  public async assertTextExistsBelow(
    lowerContent: string,
    upperContent: string,
  ) {
    assert.ok(await text(lowerContent, below(upperContent)).exists());
  }

  @Step("Assert text <content> does not exist")
  public async assertTextDoesNotExists(content: string) {
    assert.ok(!(await text(content).exists(0, 0)));
  }

  @Step("Assert text <expectedText> exists on the textArea. <table>")
  public async assertTextExistsOnTextArea(expectedText: string, table: Table) {
    for (const element of getElements(table)) {
      const actualText = await textBox(toLeftOf(element)).value();
      assert.equal(actualText, expectedText.trim());
    }
  }

  @Step("Assert page has set timezome")
  public async assertPageHasSetTimezone() {
    const getTime = await evaluate(() => {
      return new Date(1479579154987).toString();
    });
    assert.equal(
      getTime,
      "Sat Nov 19 2016 13:12:34 GMT-0500 (Eastern Standard Time)",
    );
  }
}
