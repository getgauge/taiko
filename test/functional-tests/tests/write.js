const {
  write,
  clear,
  near,
  textBox,
  into,
  toLeftOf,
  $,
} = require('taiko');
var _selectors = require('./selectors');

step('Write <text>', async function(text) {
  await write(text);
});

step('Clear element <cssSelector>', async function(cssSelector) {
  await clear($(cssSelector));
});

step('Write <text> into Input Field near <element>', async function(
  text,
  element,
) {
  await write(
    text,
    into(textBox(near(_selectors.getElement(element)))),
  );
});

step(
  'Write <text> into textArea to left of <element>',
  async function(text, element) {
    await write(
      text,
      into(textBox(toLeftOf(_selectors.getElement(element)))),
    );
  },
);
