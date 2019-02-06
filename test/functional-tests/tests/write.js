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
  return write(text);
});

step('Focus <table>', async function(table) {
  return await focus(_selectors.getElement(table));
});

step('Clear element that is in focus', async function() {
  return await clear();
});

step('Write <text> into Input Field near <element>', async function(
  text,
  element
) {
  return await write(
    text,
    into(inputField(near(_selectors.getElement(element))))
  );
});
