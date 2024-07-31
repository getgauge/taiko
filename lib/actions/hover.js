const {
  description,
  waitAndGetActionableElement,
} = require("./pageActionChecks");
const { scrollToElement } = require("./scrollTo");
const { defaultConfig } = require("../config");
const { highlightElement } = require("../elements/elementHelper");
const { doActionAwaitingNavigation } = require("../doActionAwaitingNavigation");
const domHandler = require("../handlers/domHandler");
const inputHandler = require("../handlers/inputHandler");

async function hover(selector, options) {
  const e = await waitAndGetActionableElement(selector, options.force);
  await scrollToElement(e);
  if (defaultConfig.headful) {
    await highlightElement(e);
  }
  const { x, y } = await domHandler.boundingBoxCenter(e.get());
  const option = {
    x: x,
    y: y,
  };
  await doActionAwaitingNavigation(options, async () => {
    option.type = "mouseMoved";
    return inputHandler.dispatchMouseEvent(option);
  });
  return `Hovered over the ${description(selector, true)}`;
}

module.exports = { hover };
