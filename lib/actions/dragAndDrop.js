const domHandler = require('../handlers/domHandler');
const inputHandler = require('../handlers/inputHandler');
const overlayHandler = require('../handlers/overlayHandler');
const { findFirstElement } = require('../elementSearch');
const { defaultConfig, setClickOptions } = require('../config');
const { doActionAwaitingNavigation } = require('../doActionAwaitingNavigation');
const { highlightElement } = require('../elements/elementHelper');
const { isElement, waitFor, isSelector, isString } = require('../helper');
const { description, waitForElementToBeActionable } = require('./pageActionChecks');

const dragAndDrop = async (source, destination) => {
  let sourceElem = await waitForElementToBeActionable(source);
  let dest =
    isSelector(destination) || isString(destination) || isElement(destination)
      ? await findFirstElement(destination)
      : destination;
  let options = setClickOptions({});
  await doActionAwaitingNavigation(options, async () => {
    if (defaultConfig.headful) {
      await highlightElement(sourceElem);
      if (isElement(dest)) {
        await highlightElement(dest);
      }
    }
    await dispatchDragAndDropMouseEvent(options, sourceElem, dest);
  });
  const desc = isElement(dest)
    ? `Dragged and dropped ${description(sourceElem, true)} to ${description(dest, true)}}`
    : `Dragged and dropped ${description(sourceElem, true)} at ${JSON.stringify(destination)}`;
  return desc;
};

const dispatchDragAndDropMouseEvent = async (options, sourceElem, dest) => {
  let sourcePosition = await domHandler.boundingBoxCenter(sourceElem.get());
  await scrollTo(sourceElem);
  options.x = sourcePosition.x;
  options.y = sourcePosition.y;
  options.type = 'mouseMoved';
  await inputHandler.dispatchMouseEvent(options);
  options.type = 'mousePressed';
  await inputHandler.dispatchMouseEvent(options);
  let destPosition = await calculateDestPosition(sourceElem.get(), dest);
  await inputHandler.mouse_move(sourcePosition, destPosition);
  options.x = destPosition.x;
  options.y = destPosition.y;
  options.type = 'mouseReleased';
  await inputHandler.dispatchMouseEvent(options);
};

const calculateDestPosition = async (sourceElementObjectId, dest) => {
  if (isElement(dest)) {
    await scrollTo(dest);
    return await domHandler.boundingBoxCenter(dest.get());
  }
  const destPosition = await domHandler.calculateNewCenter(sourceElementObjectId, dest);
  const newBoundary = destPosition.newBoundary;
  if (defaultConfig.headful) {
    await overlayHandler.highlightQuad([
      newBoundary.right,
      newBoundary.top,
      newBoundary.right,
      newBoundary.bottom,
      newBoundary.left,
      newBoundary.bottom,
      newBoundary.left,
      newBoundary.top,
    ]);
    await waitFor(1000);
    await overlayHandler.hideHighlight();
  }
  return destPosition;
};

module.exports = { dragAndDrop };
