const assert = require('assert');
import { getElements } from './selectors';
import { Step } from 'gauge-ts';
import { title, text, textBox, toLeftOf, evaluate } from 'taiko';

export default class Assert {
  @Step('Assert title to be <userTitle>')
  public async assertTitle(userTitle) {
    assert.ok((await title()).includes(userTitle));
  }

  @Step('Assert Exists <table>')
  public async assertExists(table) {
    for (const element of getElements(table)) {
      assert.ok(await element.exists());
    }
  }

  @Step('assert text should be empty into <table>')
  public async assertTextToBeEmpty(table) {
    for (const element of getElements(table)) {
      assert.equal(await element.text(), '');
    }
  }

  @Step('Assert text <content> exists on the page.')
  public async assertTextExists(content) {
    assert.ok(await text(content).exists());
  }

  @Step('Assert text <content> does not exist')
  public async assertTextDoesNotExists(content) {
    assert.ok(!(await text(content).exists()));
  }

  @Step('Assert text <expectedText> exists on the textArea. <table>')
  public async assertTextExistsOnTextArea(expectedText, table) {
    for (const element of getElements(table)) {
      const actualText = await textBox(toLeftOf(element)).value();
      assert.equal(actualText, expectedText.trim());
    }
  }

  @Step('Assert page has set timezome')
  public async assertPageHasSetTimezone() {
    const getTime = await evaluate(() => {
      return new Date(1479579154987).toString();
    });
    assert.equal(getTime, 'Sat Nov 19 2016 13:12:34 GMT-0500 (Eastern Standard Time)');
  }
}
