import { paste, clear, near, textBox, into, toLeftOf, $ } from 'taiko';
import { getElements } from './selectors';
import { Step, Table } from 'gauge-ts';

export default class Paste {
  @Step('Paste <text>')
  public async pasteText(text: string) {
    await paste(text);
  }

  @Step('Clear element <cssSelector>')
  public async clearElement(cssSelector: string) {
    await clear($(cssSelector));
  }

  @Step('Paste <text> into Input Field near <table>')
  public async pasteIntoInputFieldNear(text: string, table: Table) {
    for (const element of getElements(table)) {
      await paste(text, into(textBox(near(element))));
    }
  }

  @Step('Paste <text> into textArea to left of <table>')
  public async pasteIntoTextAreaToLeftOf(text: string, table: Table) {
    for (const element of getElements(table)) {
      await paste(text, into(textBox(toLeftOf(element))));
    }
  }
}
