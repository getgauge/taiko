const { isSelector, isElement, isString } = require('../helper');
const { waitAndGetActionableElement } = require('./pageActionChecks');
const { scrollToElement } = require('./scrollTo');
const runtimeHandler = require('../handlers/runtimeHandler');

const focus = async (selector) => {
  let elem = selector;
  if (isSelector(selector) || isElement(selector) || isString(selector)) {
    elem = await waitAndGetActionableElement(selector);
  }
  await scrollToElement(elem);
  await runtimeHandler.runtimeCallFunctionOn(focusElement, null, {
    objectId: elem.get(),
  });
  function focusElement() {
    this.focus();
    return true;
  }
};

module.exports = { focus };
