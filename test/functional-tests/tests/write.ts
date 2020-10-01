import { write, clear, near, textBox, into, toLeftOf, $ } from 'taiko';
import { getElements } from './selectors';
import { Step, Table } from 'gauge-ts';

export default class Write {
  @Step('Write <text>')
  public async writeText(text: string) {
    await write(text);
  }

  @Step('Clear element <cssSelector>')
  public async clearElement(cssSelector: string) {
    await clear($(cssSelector));
  }

  @Step('Write <text> into Input Field near <table>')
  public async writeIntoInputFieldNear(text: string, table: Table) {
    for (const element of getElements(table)) {
      await write(text, into(textBox(near(element))));
    }
  }

  @Step('Write <text> into textArea to left of <table>')
  public async writeIntoTextAreaToLeftOf(text: string, table: Table) {
    for (const element of getElements(table)) {
      await write(text, into(textBox(toLeftOf(element))));
    }
  }
}
