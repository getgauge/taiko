const { RelativeSearchElement, handleRelativeSearch } = require('../proximityElementSearch');
const { findElements } = require('../elementSearch');
const { isElement, isSelector, isString, assertType } = require('../helper');
const { setClickOptions, defaultConfig } = require('../config');
const domHandler = require('../handlers/domHandler');
const runtimeHandler = require('../handlers/runtimeHandler');
const { simulateMouseClick } = require('../handlers/inputHandler');
const { description, checkIfElementIsCovered } = require('./pageActionChecks');
const { scrollToElement } = require('./scrollTo');
const { doActionAwaitingNavigation } = require('../doActionAwaitingNavigation');
const { highlightElement } = require('../elements/elementHelper');

async function _click(selector, options, ...args) {
  const elems = await handleRelativeSearch(await findElements(selector), args);
  let elemsLength = elems.length;
  let isElemAtPoint;
  let X;
  let Y;
  options = setClickOptions(options);
  if (elemsLength > options.elementsToMatch) {
    elems.splice(options.elementsToMatch, elems.length);
  }
  for (let elem of elems) {
    const objectId = elem.get();
    isElemAtPoint = false;
    await scrollToElement(elem);
    isElemAtPoint = await checkIfElementIsCovered(elem);
    let isDisabled = await elem.isDisabled();
    if (isDisabled) {
      throw Error(description(selector) + 'is disabled');
    }
    if (isElemAtPoint) {
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
        objectId,
        () => type !== 'file',
        'Unsupported operation, use `attach` on file input field',
      );
      let { x, y } = await domHandler.boundingBoxCenter(objectId);
      (X = x), (Y = y);
      if (defaultConfig.headful) {
        await highlightElement(elem);
      }
      break;
    }
  }
  if (!isElemAtPoint && elemsLength != elems.length) {
    throw Error('Please provide a more specific selector, too many matches.');
  }
  if (!isElemAtPoint) {
    throw Error(description(selector) + ' is covered by other element');
  }
  (options.x = X), (options.y = Y);
  options.noOfClicks = options.noOfClicks || 1;
  for (let count = 0; count < options.noOfClicks; count++) {
    await doActionAwaitingNavigation(options, async () => {
      await simulateMouseClick(options);
    });
  }
}

async function click(selector, options = {}, ...args) {
  if (options instanceof RelativeSearchElement) {
    args = [options].concat(args);
    options = {};
  }
  if (isSelector(selector) || isString(selector) || isElement(selector)) {
    options.noOfClicks = options.clickCount || 1;
    await _click(selector, options, ...args);

    return 'Clicked ' + description(selector, true) + ' ' + options.noOfClicks + ' times';
  } else {
    options = setClickOptions(options, selector.x, selector.y);
    options.noOfClicks = options.clickCount || 1;
    for (let count = 0; count < options.noOfClicks; count++) {
      await doActionAwaitingNavigation(options, async () => {
        await simulateMouseClick(options);
      });
    }

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
