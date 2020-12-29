const { findActiveElement } = require('../elementSearch');
const { description, waitAndGetActionableElement, checksMap } = require('./pageActionChecks');
const { doActionAwaitingNavigation } = require('../doActionAwaitingNavigation');
const { defaultConfig } = require('../config');
const inputHandler = require('../handlers/inputHandler');
const runtimeHandler = require('../handlers/runtimeHandler');
const { highlightElement } = require('../elements/elementHelper');

const _clear = async (elem) => {
  await runtimeHandler.runtimeCallFunctionOn(
    function () {
      document.execCommand('selectall', false, null);
    },
    null,
    { objectId: elem },
  );
  await inputHandler.down('Backspace');
  await inputHandler.up('Backspace');
};

const clear = async (selector, options) => {
  selector = selector ? selector : await findActiveElement();
  const element = await waitAndGetActionableElement(selector, [checksMap.writable]);
  const desc = !selector ? 'Cleared element on focus' : 'Cleared ' + description(selector, true);
  await doActionAwaitingNavigation(options, async () => {
    await _clear(element.get());
    if (defaultConfig.headful) {
      await highlightElement(element);
    }
  });
  return desc;
};

module.exports = { clear };
