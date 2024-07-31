const {
  description,
  waitAndGetActionableElement,
  checksMap,
} = require("./pageActionChecks");
const { doActionAwaitingNavigation } = require("../doActionAwaitingNavigation");
const { defaultConfig } = require("../config");
const inputHandler = require("../handlers/inputHandler");
const runtimeHandler = require("../handlers/runtimeHandler");
const { highlightElement } = require("../elements/elementHelper");
const { focus } = require("./focus");

const _clear = async (elem) => {
  await runtimeHandler.runtimeCallFunctionOn(
    () => {
      document.execCommand("selectall", false, null);
    },
    null,
    { objectId: elem },
  );
  await inputHandler.down("Backspace");
  await inputHandler.up("Backspace");
};

const clear = async (selector, options) => {
  const element = await waitAndGetActionableElement(selector, options.force, [
    checksMap.writable,
  ]);
  const desc = !selector
    ? "Cleared element on focus"
    : "Cleared " + description(element, true);
  await doActionAwaitingNavigation(options, async () => {
    await focus(element, options);
    if (defaultConfig.headful) {
      await highlightElement(element);
    }
    await _clear(element.get());
  });
  return desc;
};

module.exports = { clear };
