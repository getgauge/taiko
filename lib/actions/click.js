const { RelativeSearchElement } = require('../proximityElementSearch');
const { isElement, isSelector, isString, assertType } = require('../helper');
const { setClickOptions, defaultConfig } = require('../config');
const domHandler = require('../handlers/domHandler');
const runtimeHandler = require('../handlers/runtimeHandler');
const { simulateMouseClick, tap } = require('../handlers/inputHandler');
const { description, waitAndGetActionableElement, checksMap } = require('./pageActionChecks');
const { doActionAwaitingNavigation } = require('../doActionAwaitingNavigation');
const { highlightElement } = require('../elements/elementHelper');

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
    () => type !== 'file',
    'Unsupported operation, use `attach` on file input field',
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
          });
    });
  }
}

async function click(selector, options = {}, ...args) {
  if (options instanceof RelativeSearchElement) {
    args = [options].concat(args);
    options = {};
  }
  options = setClickOptions(options);
  options.noOfClicks = options.clickCount || 1;

  if (isSelector(selector) || isString(selector) || isElement(selector)) {
    const elementActionabilityChecks = [checksMap.covered];

    const element = await waitAndGetActionableElement(
      selector,
      options.force,
      elementActionabilityChecks,
      args,
    );
    await checkIfFileType(element);

    if (options.position === 'right') {
      let { x, y } = await domHandler.boundingBoxRight(element.get());
      (options.x = x), (options.y = y);
    } else if (options.position === 'left') {
      let { x, y } = await domHandler.boundingBoxLeft(element.get());
      (options.x = x), (options.y = y);
    } else if (options.position === 'topLeft') {
      let { x, y } = await domHandler.boundingBoxTopLeft(element.get());
      (options.x = x), (options.y = y);
    } else if (options.position === 'topRight') {
      let { x, y } = await domHandler.boundingBoxTopRight(element.get());
      (options.x = x), (options.y = y);
    } else if (options.position === 'bottomRight') {
      let { x, y } = await domHandler.boundingBoxBottomRight(element.get());
      (options.x = x), (options.y = y);
    } else if (options.position === 'bottomLeft') {
      let { x, y } = await domHandler.boundingBoxBottomLeft(element.get());
      (options.x = x), (options.y = y);
    } else {
      let { x, y } = await domHandler.boundingBoxCenter(element.get());
      (options.x = x), (options.y = y);
    }

    if (defaultConfig.headful) {
      await highlightElement(element);
    }

    await simulateInputEvents(options);
    return 'Clicked ' + description(selector, true) + ' ' + options.noOfClicks + ' times';
  } else {
    await simulateInputEvents(options);
    return (
      'Clicked ' +
      options.noOfClicks +
      ' times on coordinates x : ' +
      selector.x +
      ' and y : ' +
      selector.y
    );
  }
}

module.exports = { click };
