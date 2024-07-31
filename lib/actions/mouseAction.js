const { isSelector, isString } = require("../helper");
const { scrollToElement } = require("./scrollTo");
const { waitAndGetActionableElement } = require("./pageActionChecks");
const {
  setClickOptions,
  setNavigationOptions,
  defaultConfig,
} = require("../config");
const domHandler = require("../handlers/domHandler");
const inputHandler = require("../handlers/inputHandler");
const overlayHandler = require("../handlers/overlayHandler");
const { doActionAwaitingNavigation } = require("../doActionAwaitingNavigation");

const mouseAction = async (selector, action, coordinates, options) => {
  const actions = ["press", "move", "release"];
  if (
    !actions.includes(selector) &&
    !isSelector(selector) &&
    !isString(selector)
  ) {
    throw Error(`Invalid Selector value passed : ${selector}`);
  }
  if (!actions.includes(selector)) {
    const elem = await waitAndGetActionableElement(selector, options.force);
    if (elem == null) {
      throw Error("Please provide a valid selector, unable to find element");
    }
    await scrollToElement(elem);
    const rect = await domHandler.getBoundingClientRect(elem.get());
    coordinates.x = coordinates.x + Number.parseInt(rect.left);
    coordinates.y = coordinates.y + Number.parseInt(rect.top);
  } else if (actions.includes(selector)) {
    coordinates = action;
    action = selector;
  }
  options = setNavigationOptions(options);
  if (defaultConfig.headful) {
    await overlayHandler.highlightRect({
      x: coordinates.x,
      y: coordinates.y,
      width: 1,
      height: 1,
    });
  }
  options = setClickOptions(options, coordinates.x, coordinates.y);
  await doActionAwaitingNavigation(options, async () => {
    if (action === "press") {
      options.type = "mousePressed";
    } else if (action === "move") {
      options.type = "mouseMoved";
    } else if (action === "release") {
      options.type = "mouseReleased";
    }
    await inputHandler.dispatchMouseEvent(options);
  });
  return `Performed mouse ${action}action at {${coordinates.x}, ${coordinates.y}}`;
};

module.exports = { mouseAction };
