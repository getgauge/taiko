'use strict';
var _selectors = require('./selectors');

const {
  link,
  click,
  below,
  above,
  toRightOf,
  rightClick,
  doubleClick,
  mouseAction,
  $,
} = require('taiko');

step('Click link <userlink> below <table>', async function(
  userlink,
  table,
) {
  await click(link(userlink, below(_selectors.getElement(table))));
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
  var element = _selectors.getElement(table);
  await click(link(above(element)));
});

step('Click link to right of <table>', async function(table) {
  await click(link(toRightOf(_selectors.getElement(table))));
});

step('Right click <table>', async function(table) {
  await rightClick(_selectors.getElement(table));
});

step('Double click <table>', async function(table) {
  await doubleClick(_selectors.getElement(table));
});

step(
  'Press & Release To Element with element1 and <X>,<Y> co-ordinates',
  async function(X, Y) {
    await mouseAction($('#button1'), 'press', {
      x: parseInt(X),
      y: parseInt(Y),
    });
    await mouseAction($('#button1'), 'release', {
      x: parseInt(X),
      y: parseInt(Y),
    });
  },
);

step(
  'Press & Release To Element with element2 and <X>,<Y> co-ordinates',
  async function(X, Y) {
    await mouseAction($('#button4'), 'press', {
      x: parseInt(X),
      y: parseInt(Y),
    });
    await mouseAction($('#button4'), 'release', {
      x: parseInt(X),
      y: parseInt(Y),
    });
  },
);

step(
  'Press & Release To Element with <X>,<Y> co-ordinates',
  async function(X, Y) {
    await mouseAction('press', {
      x: parseInt(X),
      y: parseInt(Y),
    });
    await mouseAction('release', {
      x: parseInt(X),
      y: parseInt(Y),
    });
  },
);
