'use strict';
import { getElements } from './selectors';

import {
  link,
  click,
  below,
  button,
  above,
  toRightOf,
  rightClick,
  doubleClick,
  mouseAction,
  $,
} from 'taiko';

import { Step } from 'gauge-ts';

export default class Click {
  @Step('Click link <userlink> below <table>')
  public async clickLinkBelowTable(userlink, table) {
    for (const element of getElements(table)) {
      await click(link(userlink, below(element)));
    }
  }

  @Step('Click an element that contains <text>')
  public async clickElementWithText(text) {
    await click(text);
  }

  @Step('Click link <userlink>')
  public async clickLink(userlink) {
    await click(link(userlink));
  }

  @Step('Click <selector>')
  public async clickSelector(selector) {
    await click(selector);
  }

  @Step('Click link above <table>')
  public async clickLinkAbove(table) {
    for (const element of getElements(table)) {
      await click(link(above(element)));
    }
  }

  @Step('Click button to right of <table>')
  public async clickButtonToRightOf(table) {
    for (const element of getElements(table)) {
      await click(button(toRightOf(element)));
    }
  }

  @Step('Right click <table>')
  public async rightClick(table) {
    for (const element of getElements(table)) {
      await rightClick(element);
    }
  }

  @Step('Double click <table>')
  public async doubleClick(table) {
    for (const element of getElements(table)) {
      await doubleClick(element);
    }
  }

  @Step('Press & Release To Element with element1 and <X>,<Y> co-ordinates')
  public async pressAndReleaseElement1(X, Y) {
    await mouseAction($('#button1'), 'press', {
      x: parseInt(X),
      y: parseInt(Y),
    });
    await mouseAction($('#button1'), 'release', {
      x: parseInt(X),
      y: parseInt(Y),
    });
  }

  @Step('Press & Release To Element with element2 and <X>,<Y> co-ordinates')
  public async pressAndReleaseElement2(X, Y) {
    await mouseAction($('#button4'), 'press', {
      x: parseInt(X),
      y: parseInt(Y),
    });
    await mouseAction($('#button4'), 'release', {
      x: parseInt(X),
      y: parseInt(Y),
    });
  }

  @Step('Press & Release To Element with <X>,<Y> co-ordinates')
  public async pressAndReleaseElement(X, Y) {
    await mouseAction('press', {
      x: parseInt(X),
      y: parseInt(Y),
    });
    await mouseAction('release', {
      x: parseInt(X),
      y: parseInt(Y),
    });
  }
}
