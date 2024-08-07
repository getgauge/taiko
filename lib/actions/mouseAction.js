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
  let _coordinates = { ...coordinates };
  let _action = action;
  let _options = { ...options };

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
    _coordinates.x = _coordinates.x + Number.parseInt(rect.left);
    _coordinates.y = _coordinates.y + Number.parseInt(rect.top);
  } else if (actions.includes(selector)) {
    _coordinates = action;
    _action = selector;
  }
  _options = setNavigationOptions(_options);
  if (defaultConfig.headful) {
    await overlayHandler.highlightRect({
      x: _coordinates.x,
      y: _coordinates.y,
      width: 1,
      height: 1,
    });
  }
  _options = setClickOptions(_options, _coordinates.x, _coordinates.y);
  await doActionAwaitingNavigation(_options, async () => {
    if (_action === "press") {
      _options.type = "mousePressed";
    } else if (_action === "move") {
      _options.type = "mouseMoved";
    } else if (_action === "release") {
      _options.type = "mouseReleased";
    }
    await inputHandler.dispatchMouseEvent(_options);
  });
  return `Performed mouse ${_action} action at {${_coordinates.x}, ${_coordinates.y}}`;
};

module.exports = { mouseAction };
