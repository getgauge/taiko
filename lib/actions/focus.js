const { isSelector, isElement, isString } = require('../helper');
const { waitAndGetActionableElement, description } = require('./pageActionChecks');
const runtimeHandler = require('../handlers/runtimeHandler');
const { highlightElement } = require('../elements/elementHelper');
const { defaultConfig } = require('../config');
const { doActionAwaitingNavigation } = require('../doActionAwaitingNavigation');

const focus = async (selector, options = {}, highlight = false) => {
  let elem = selector;
  if (isSelector(selector) || isElement(selector) || isString(selector)) {
    elem = await waitAndGetActionableElement(selector, options.force);
  }
  await doActionAwaitingNavigation(options, async () => {
    if (defaultConfig.headful && highlight) {
      await highlightElement(elem);
    }
    await runtimeHandler.runtimeCallFunctionOn(focusElement, null, {
      objectId: elem.get(),
    });
    function focusElement() {
      this.focus();
      return true;
    }
  });
  return 'Focussed on the ' + description(selector, true);
};

module.exports = { focus };
