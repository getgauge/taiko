const { write, clear, near, textBox, into, toLeftOf, $ } = require('taiko');
var { getElements } = require('./selectors');

step('Write <text>', async function(text) {
  await write(text);
});

step('Clear element <cssSelector>', async function(cssSelector) {
  await clear($(cssSelector));
});

step('Write <text> into Input Field near <table>', async function(text, table) {
  for (const element of getElements(table)) {
    await write(text, into(textBox(near(element))));
  }
});

step('Write <text> into textArea to left of <table>', async function(text, table) {
  for (const element of getElements(table)) {
    await write(text, into(textBox(toLeftOf(element))));
  }
});
