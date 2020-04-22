import { getElements } from './selectors';
const assert = require('assert');
import {
  scrollTo,
  scrollUp,
  press,
  hover,
  dragAndDrop,
  $,
  currentURL,
  clear,
  setCookie,
  deleteCookies,
  tap,
  toLeftOf,
  evaluate,
} from 'taiko';
var URL = require('url').URL;
import {Step} from 'gauge-ts';

export default class PageActions{

@Step('Scroll to <table>')
public async scrollToTable(table) {
  for (const element of getElements(table)) {
    await scrollTo(element);
  }
}

@Step('Scroll up <table>')
public async scrollUpTable(table) {
  for (const element of getElements(table)) {
    await scrollUp(element);
  }
}

@Step('Press <key>')
public async pressKey(key) {
  await press(key);
}

@Step('Hover on element <table>')
public async hoverOnElement(table) {
  for (const element of getElements(table)) {
    await hover(element);
  }
}

@Step('Drag <source> and drop to <destination>')
public async dragSourceToDestination(source, destination) {
  await dragAndDrop($(source), $(destination));
}

@Step('Drag <source> and drop at <directionTable>')
public async  dragSourceToDirection(source, directionTable) {
  const direction = {};
  directionTable.rows.forEach((row) => {
    direction[row.cells[0]] = parseInt(row.cells[1]);
  });
  await dragAndDrop($(source), direction);
}

@Step('Assert url host is <hostName>')
public async assertUrlOfHost(hostName) {
  const url = await currentURL();
  assert.equal(new URL(url).hostname, hostName);
}

@Step('Assert page navigated back <hostname>')
public async assertPageNavigatedBack(hostName) {
  const url = await currentURL();
  assert.equal(new URL(url).hostname, hostName);
}

@Step('Assert page navigated to <target>')
public async assertPageNavigatedToTarget(target) {
  const url = await currentURL();
  assert.equal(new URL(url).pathname, target);
}

@Step('Tap on <arg0>')
public async tapOnElement(arg0) {
  await tap(arg0);
}

@Step('Assert tap on screen')
public async assertTapOnScreen() {
  const touch = await evaluate(() => []);
  assert.deepEqual(touch, ['Touchstart: 0', 'Touchend: 0']);
}

@Step('clear textArea to left of <table>')
public async clearTextarea(table) {
  for (const element of getElements(table)) {
    await clear(toLeftOf(element));
  }
}

@Step('set cookie with <key> and <value>')
public async setCookieWithKeyValue(key, value) {
  await setCookie(key, value, { url: 'http://localhost:3001/' });
}

@Step('delete cookie with <key>')
public async deleteCookieWithKey(key) {
  await deleteCookies(key, { url: 'http://localhost:3001/' });
}

}
