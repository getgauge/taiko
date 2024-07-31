const domHandler = require("../handlers/domHandler");
const inputHandler = require("../handlers/inputHandler");
const overlayHandler = require("../handlers/overlayHandler");
const runtimeHandler = require("../handlers/runtimeHandler");
const { defaultConfig, setClickOptions } = require("../config");
const { doActionAwaitingNavigation } = require("../doActionAwaitingNavigation");
const { highlightElement } = require("../elements/elementHelper");
const { isElement, wait, isSelector, isString } = require("../helper");
const { scrollToElement } = require("./scrollTo");
const {
  description,
  waitAndGetActionableElement,
} = require("./pageActionChecks");

const dragAndDrop = async (source, destination, options) => {
  const sourceElem = await waitAndGetActionableElement(source, options.force);
  const dest =
    isSelector(destination) || isString(destination) || isElement(destination)
      ? await waitAndGetActionableElement(destination, options.force)
      : destination;
  if (!(await sourceElem.isVisible())) {
    throw new Error("Taiko cannot drag hidden elements");
  }
  if (isElement(dest)) {
    if (!(await dest.isVisible())) {
      throw new Error("Taiko cannot drag hidden elements");
    }
  }
  options = setClickOptions(options);
  await doActionAwaitingNavigation(options, async () => {
    if (defaultConfig.headful) {
      await highlightElement(sourceElem);
      if (isElement(dest)) {
        await highlightElement(dest);
      }
    }
    const sourcePosition = await domHandler.boundingBoxCenter(sourceElem.get());
    const destPosition = await calculateDestPosition(sourceElem.get(), dest);
    await scrollToElement(sourceElem);
    const sourceDraggable = await sourceElem.isDraggable();
    sourceDraggable
      ? await dragAndDropHTML5Element(
          sourcePosition,
          destPosition,
          sourceElem.get(),
        )
      : await dispatchDragAndDropMouseEvent(
          options,
          sourcePosition,
          destPosition,
        );
  });
  const desc = isElement(dest)
    ? `Dragged and dropped ${description(sourceElem, true)} to ${description(dest, true)}}`
    : `Dragged and dropped ${description(sourceElem, true)} at ${JSON.stringify(destination)}`;
  return desc;
};

const dispatchDragAndDropMouseEvent = async (
  options,
  sourcePosition,
  destPosition,
) => {
  delete options.force;
  options.x = sourcePosition.x;
  options.y = sourcePosition.y;
  options.type = "mouseMoved";
  await inputHandler.dispatchMouseEvent(options);
  options.type = "mousePressed";
  await inputHandler.dispatchMouseEvent(options);
  await inputHandler.mouse_move(sourcePosition, destPosition);
  options.x = destPosition.x;
  options.y = destPosition.y;
  options.type = "mouseReleased";
  await inputHandler.dispatchMouseEvent(options);
};

const dragAndDropHTML5Element = async (
  sourcePosition,
  destPosition,
  sourceElementObjectId,
) => {
  const args = { sourcePosition, destPosition };
  function simulateDragAndDrop(args) {
    let sourceElement, targetElement;
    sourceElement = document.elementFromPoint(
      args.sourcePosition.x,
      args.sourcePosition.y,
    );
    let parsedShadowRoots = [];
    while (
      sourceElement.shadowRoot &&
      !parsedShadowRoots.includes(sourceElement.shadowRoot)
    ) {
      parsedShadowRoots.push(sourceElement.shadowRoot);
      sourceElement = sourceElement.shadowRoot.elementFromPoint(
        args.sourcePosition.x,
        args.sourcePosition.y,
      );
    }
    targetElement = document.elementFromPoint(
      args.destPosition.x,
      args.destPosition.y,
    );
    parsedShadowRoots = [];
    while (
      targetElement.shadowRoot &&
      !parsedShadowRoots.includes(targetElement.shadowRoot)
    ) {
      parsedShadowRoots.push(targetElement.shadowRoot);
      targetElement = targetElement.shadowRoot.elementFromPoint(
        args.destPosition.x,
        args.destPosition.y,
      );
    }
    const dataTransfer = new DataTransfer();

    const dragStartEvent = document.createEvent("CustomEvent");
    dragStartEvent.dataTransfer = dataTransfer;
    dragStartEvent.initCustomEvent("dragstart", true, true, null);
    dragStartEvent.clientX = sourceElement.getBoundingClientRect().top;
    dragStartEvent.clientY = sourceElement.getBoundingClientRect().left;
    sourceElement.dispatchEvent(dragStartEvent);

    const dropEvent = document.createEvent("CustomEvent");
    dropEvent.dataTransfer = dataTransfer;
    dropEvent.initCustomEvent("drop", true, true, null);
    dropEvent.clientX = targetElement.getBoundingClientRect().top;
    dropEvent.clientY = targetElement.getBoundingClientRect().left;
    targetElement.dispatchEvent(dropEvent);

    const dragoverEvent = document.createEvent("CustomEvent");
    dragoverEvent.dataTransfer = dataTransfer;
    dragoverEvent.initCustomEvent("dragover", true, true, null);
    dragoverEvent.clientX = targetElement.getBoundingClientRect().top;
    dragoverEvent.clientY = targetElement.getBoundingClientRect().left;
    targetElement.dispatchEvent(dragoverEvent);

    const dragEndEvent = document.createEvent("CustomEvent");
    dragEndEvent.dataTransfer = dataTransfer;
    dragEndEvent.initCustomEvent("dragend", true, true, null);
    dragEndEvent.clientX = targetElement.getBoundingClientRect().top;
    dragEndEvent.clientY = targetElement.getBoundingClientRect().left;
    sourceElement.dispatchEvent(dragEndEvent);
  }
  await runtimeHandler.runtimeCallFunctionOn(simulateDragAndDrop, null, {
    objectId: sourceElementObjectId,
    arg: args,
  });
};

const calculateDestPosition = async (sourceElementObjectId, dest) => {
  if (isElement(dest)) {
    await scrollToElement(dest);
    return await domHandler.boundingBoxCenter(dest.get());
  }
  const destPosition = await domHandler.calculateNewCenter(
    sourceElementObjectId,
    dest,
  );
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
    await wait(1000);
    await overlayHandler.hideHighlight();
  }
  return destPosition;
};

module.exports = { dragAndDrop };
