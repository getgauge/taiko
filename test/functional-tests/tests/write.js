const {
  write,
  focus,
  clear,
  near,
  inputField,
  into
} = require('../../../lib/taiko');
var _selectors = require('./selectors');

step('Write <text>', async function(text) {
  await write(text);
});

step('Focus <table>', async function(table) {
  await focus(_selectors.getElement(table));
});

step('Clear element that is in focus', async function() {
  await clear();
});

step('Write <text> into Input Field near <element>', async function(
  text,
  element
) {
  await write(
    text,
    into(inputField(near(_selectors.getElement(element))))
  );
});
