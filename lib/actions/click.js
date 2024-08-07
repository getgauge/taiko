const { RelativeSearchElement } = require("../proximityElementSearch");
const { isElement, isSelector, isString, assertType } = require("../helper");
const { setClickOptions, defaultConfig } = require("../config");
const domHandler = require("../handlers/domHandler");
const runtimeHandler = require("../handlers/runtimeHandler");
const { simulateMouseClick, tap } = require("../handlers/inputHandler");
const {
  description,
  waitAndGetActionableElement,
  checksMap,
} = require("./pageActionChecks");
const { doActionAwaitingNavigation } = require("../doActionAwaitingNavigation");
const { highlightElement } = require("../elements/elementHelper");

async function checkIfFileType(elem) {
  const type = (
    await runtimeHandler.runtimeCallFunctionOn(
      function getType() {
        return this.type;
      },
      null,
      {
        objectId: elem.get(),
        returnByValue: true,
      },
    )
  ).result.value;
  assertType(
    elem.get(),
    () => type !== "file",
    "Unsupported operation, use `attach` on file input field",
  );
}

async function simulateInputEvents(options) {
  for (let count = 0; count < options.noOfClicks; count++) {
    await doActionAwaitingNavigation(options, async () => {
      options.tap
        ? await tap(options.x, options.y)
        : await simulateMouseClick({
            x: options.x,
            y: options.y,
            clickCount: options.clickCount,
            button: options.button,
            modifiers: options.modifiers,
          });
    });
  }
}

async function click(selector, options = {}, ...args) {
  let allOptions = options;
  if (options instanceof RelativeSearchElement) {
    allOptions = [options].concat(args);
  }
  const clickOptions = setClickOptions(allOptions);
  clickOptions.noOfClicks = clickOptions.clickCount || 1;

  if (isSelector(selector) || isString(selector) || isElement(selector)) {
    const elementActionabilityChecks = [checksMap.covered];

    const element = await waitAndGetActionableElement(
      selector,
      clickOptions.force,
      elementActionabilityChecks,
      allOptions,
    );
    await checkIfFileType(element);

    const { x, y } = await domHandler.boundingBox(
      clickOptions.position,
      element.get(),
    );

    clickOptions.x = x;
    clickOptions.y = y;

    if (defaultConfig.headful) {
      await highlightElement(element);
    }

    await simulateInputEvents(clickOptions);
    return `Clicked ${description(selector, true)} ${clickOptions.noOfClicks} times`;
  }

  clickOptions.x = selector.x;
  clickOptions.y = selector.y;

  await simulateInputEvents(clickOptions);
  return `Clicked ${clickOptions.noOfClicks} times on coordinates x : ${selector.x} and y : ${selector.y}`;
}

module.exports = { click };
