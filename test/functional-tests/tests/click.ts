import { getElements } from "./selectors";

import {
  $,
  type SearchElement,
  above,
  below,
  button,
  click,
  doubleClick,
  link,
  mouseAction,
  rightClick,
  toRightOf,
} from "taiko";

import { Step, type Table } from "gauge-ts";

export default class Click {
  @Step("Click link <userlink> below <table>")
  public async clickLinkBelowTable(userlink: SearchElement, table: Table) {
    for (const element of getElements(table)) {
      await click(link(userlink, below(element)));
    }
  }

  @Step("Click an element that contains <text>")
  public async clickElementWithText(text: string) {
    await click(text);
  }

  @Step("Click link <userlink>")
  public async clickLink(userlink: SearchElement) {
    await click(link(userlink));
  }

  @Step("Click <selector>")
  public async clickSelector(selector: string) {
    await click(selector);
  }

  @Step("Click link above <table>")
  public async clickLinkAbove(table: Table) {
    for (const element of getElements(table)) {
      await click(link(above(element)));
    }
  }

  @Step("Click button to right of <table>")
  public async clickButtonToRightOf(table: Table) {
    for (const element of getElements(table)) {
      await click(button(toRightOf(element)));
    }
  }

  @Step("Right click <table>")
  public async rightClick(table: Table) {
    for (const element of getElements(table)) {
      await rightClick(element);
    }
  }

  @Step("Double click <table>")
  public async doubleClick(table: Table) {
    for (const element of getElements(table)) {
      await doubleClick(element);
    }
  }

  @Step("Press & Release To Element with element1 and <X>,<Y> co-ordinates")
  public async pressAndReleaseElement1(X: string, Y: string) {
    await mouseAction($("#button1"), "press", {
      x: Number.parseInt(X),
      y: Number.parseInt(Y),
    });
    await mouseAction($("#button1"), "release", {
      x: Number.parseInt(X),
      y: Number.parseInt(Y),
    });
  }

  @Step("Press & Release To Element with element2 and <X>,<Y> co-ordinates")
  public async pressAndReleaseElement2(X: string, Y: string) {
    await mouseAction($("#button4"), "press", {
      x: Number.parseInt(X),
      y: Number.parseInt(Y),
    });
    await mouseAction($("#button4"), "release", {
      x: Number.parseInt(X),
      y: Number.parseInt(Y),
    });
  }

  @Step("Press & Release To Element with <X>,<Y> co-ordinates")
  public async pressAndReleaseElement(X: string, Y: string) {
    await mouseAction("press", {
      x: Number.parseInt(X),
      y: Number.parseInt(Y),
    });
    await mouseAction("release", {
      x: Number.parseInt(X),
      y: Number.parseInt(Y),
    });
  }
}
