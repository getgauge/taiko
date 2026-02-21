import { getElements } from "./selectors";
const assert = require("node:assert");
import {
  $,
  type SearchElement,
  clear,
  currentURL,
  deleteCookies,
  dragAndDrop,
  evaluate,
  hover,
  press,
  scrollTo,
  scrollUp,
  setCookie,
  tap,
  toLeftOf,
} from "taiko";
const URL = require("node:url").URL;
import { Step, type Table, type TableRow } from "gauge-ts";

export default class PageActions {
  @Step("Scroll to <table>")
  public async scrollToTable(table: Table) {
    for (const element of getElements(table)) {
      await scrollTo(element);
    }
  }

  @Step("Scroll up <table>")
  public async scrollUpTable(table: Table) {
    for (const element of getElements(table)) {
      await scrollUp(element);
    }
  }

  @Step("Press <key>")
  public async pressKey(key: string | string[]) {
    await press(key);
  }

  @Step("Hover on element <table>")
  public async hoverOnElement(table: Table) {
    for (const element of getElements(table)) {
      await hover(element);
    }
  }

  @Step("Drag <source> and drop to <destination>")
  public async dragSourceToDestination(source: string, destination: string) {
    await dragAndDrop($(source), $(destination));
  }

  @Step("Drag <source> and drop at <directionTable>")
  public async dragSourceToDirection(source: string, directionTable: Table) {
    const direction = {};

    for (const row of directionTable.getTableRows()) {
      direction[row.getCellValues()[0]] = Number.parseInt(
        row.getCellValues()[1],
      );
    }
    await dragAndDrop($(source), direction);
  }

  @Step("Assert url host is <hostName>")
  public async assertUrlOfHost(hostName: string) {
    const url = await currentURL();
    assert.equal(new URL(url).hostname, hostName);
  }

  @Step("Assert page navigated back <hostname>")
  public async assertPageNavigatedBack(hostName: string) {
    const url = await currentURL();
    assert.equal(new URL(url).hostname, hostName);
  }

  @Step("Assert page navigated to <target>")
  public async assertPageNavigatedToTarget(target: string) {
    const url = await currentURL();
    assert.equal(new URL(url).pathname, target);
  }

  @Step("Tap on <arg0>")
  public async tapOnElement(arg0: SearchElement) {
    await tap(arg0);
  }

  @Step("Assert tap on screen")
  public async assertTapOnScreen() {
    function getResult(): void {}
    const touch = await evaluate(() => getResult());
    assert.deepEqual(touch, ["Touchstart: 0", "Touchend: 0"]);
  }

  @Step("clear textArea to left of <table>")
  public async clearTextarea(table: Table) {
    for (const element of getElements(table)) {
      await clear(toLeftOf(element));
    }
  }

  @Step("set cookie with <key> and <value>")
  public async setCookieWithKeyValue(key: string, value: string) {
    await setCookie(key, value, { url: "http://localhost:3001/" });
  }

  @Step("delete cookie with <key>")
  public async deleteCookieWithKey(key: string) {
    await deleteCookies(key, { url: "http://localhost:3001/" });
  }
}
