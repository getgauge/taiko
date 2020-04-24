import { write, clear, near, textBox, into, toLeftOf, $ } from 'taiko';
import { getElements } from './selectors';
import { Step } from 'gauge-ts';

export default class Write {
  @Step('Write <text>')
  public async writeText(text) {
    await write(text);
  }

  @Step('Clear element <cssSelector>')
  public async clearElement(cssSelector) {
    await clear($(cssSelector));
  }

  @Step('Write <text> into Input Field near <table>')
  public async writeIntoInputFieldNear(text, table) {
    for (const element of getElements(table)) {
      await write(text, into(textBox(near(element))));
    }
  }

  @Step('Write <text> into textArea to left of <table>')
  public async writeIntoTextAreaToLeftOf(text, table) {
    for (const element of getElements(table)) {
      await write(text, into(textBox(toLeftOf(element))));
    }
  }
}
