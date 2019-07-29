const {
  write,
  focus,
  clear,
  near,
  textBox,
  into,
  screenshot,
  $
} = require('../../../lib/taiko');
var _selectors = require('./selectors');

step('Write <text>', async function(text) {
  await write(text);
});

step('Focus <table>', async function(table) {
  await focus(_selectors.getElement(table));
});

step("Clear element <cssSelector>", async function (cssSelector) {
  await clear($(cssSelector));
});

step('Write <text> into Input Field near <element>', async function(
  text,
  element
) {
  await write(
    text,
    into(textBox(near(_selectors.getElement(element))))
  );
});
