'use strict';
var { getElements } = require('./selectors');

const {
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
} = require('taiko');

step('Click link <userlink> below <table>', async function(userlink, table) {
  for (const element of getElements(table)) {
    await click(link(userlink, below(element)));
  }
});

step('Click an element that contains <text>', async function(text) {
  await click(text);
});

step('Click link <userlink>', async function(userlink) {
  await click(link(userlink));
});

step('Click <selector>', async function(selector) {
  await click(selector);
});

step('Click link above <table>', async function(table) {
  for (const element of getElements(table)) {
    await click(link(above(element)));
  }
});

step('Click button to right of <table>', async function(table) {
  for (const element of getElements(table)) {
    await click(button(toRightOf(element)));
  }
});

step('Right click <table>', async function(table) {
  for (const element of getElements(table)) {
    await rightClick(element);
  }
});

step('Double click <table>', async function(table) {
  for (const element of getElements(table)) {
    await doubleClick(element);
  }
});

step('Press & Release To Element with element1 and <X>,<Y> co-ordinates', async function(X, Y) {
  await mouseAction($('#button1'), 'press', {
    x: parseInt(X),
    y: parseInt(Y),
  });
  await mouseAction($('#button1'), 'release', {
    x: parseInt(X),
    y: parseInt(Y),
  });
});

step('Press & Release To Element with element2 and <X>,<Y> co-ordinates', async function(X, Y) {
  await mouseAction($('#button4'), 'press', {
    x: parseInt(X),
    y: parseInt(Y),
  });
  await mouseAction($('#button4'), 'release', {
    x: parseInt(X),
    y: parseInt(Y),
  });
});

step('Press & Release To Element with <X>,<Y> co-ordinates', async function(X, Y) {
  await mouseAction('press', {
    x: parseInt(X),
    y: parseInt(Y),
  });
  await mouseAction('release', {
    x: parseInt(X),
    y: parseInt(Y),
  });
});
