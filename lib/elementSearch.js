const {
  xpath,
  assertType,
  getIfExists,
  isString,
} = require('./helper');
const runtimeHandler = require('./handlers/runtimeHandler');
const { handleRelativeSearch } = require('./proximityElementSearch');

function match(text, ...args) {
  assertType(text);
  const get = async (tagName = '*') => {
    let elements;
    let nbspChar = String.fromCharCode(160);
    let textToTranslate = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + nbspChar;
    let translateTo = 'abcdefghijklmnopqrstuvwxyz' + ' ';
    let xpathText = `translate(normalize-space(${xpath(
      text,
    )}), "${textToTranslate}", "${translateTo}")`;
    elements = await matchExactElements(
      tagName,
      textToTranslate,
      translateTo,
      xpathText,
    );
    if (!elements || !elements.length)
      elements = await matchContainsElements(
        tagName,
        textToTranslate,
        translateTo,
        xpathText,
      );
    return await handleRelativeSearch(elements, args);
  };
  return {
    get: getIfExists(get),
    description: `Element matching text "${text}"`,
  };
}

async function matchExactElements(
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
) {
  let elements = [];
  if (tagName === '*')
    elements = await matchTextNode(
      textToTranslate,
      translateTo,
      xpathText,
    );
  let valueAndTypeElements = await matchValueOrType(
    tagName,
    textToTranslate,
    translateTo,
    xpathText,
  );
  if (valueAndTypeElements.length)
    elements = elements.concat(valueAndTypeElements);
  if (!elements || !elements.length)
    elements = await matchTextAcrossElements(
      tagName,
      textToTranslate,
      translateTo,
      xpathText,
    );
  return elements;
}

async function matchContainsElements(
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
) {
  let elements;
  if (tagName === '*')
    elements = await containsTextNode(
      textToTranslate,
      translateTo,
      xpathText,
    );
  let valueAndTypeElements = await containsValueOrType(
    tagName,
    textToTranslate,
    translateTo,
    xpathText,
  );
  if (valueAndTypeElements.length)
    elements = elements.concat(valueAndTypeElements);
  if (!elements || !elements.length)
    elements = await containsTextAcrossElements(
      tagName,
      textToTranslate,
      translateTo,
      xpathText,
    );
  if (tagName === 'button' && (!elements || !elements.length))
    elements = await containsTextInChildElements(
      tagName,
      textToTranslate,
      translateTo,
      xpathText,
    )
  return elements;
}

async function matchTextNode(
  textToTranslate,
  translateTo,
  xpathText,
) {
  return await $$xpath(
    `//text()[translate(normalize-space(string()), "${textToTranslate}", "${translateTo}")=${xpathText}]`,
  );
}

async function containsTextNode(
  textToTranslate,
  translateTo,
  xpathText,
) {
  return await $$xpath(
    `//text()[contains(translate(normalize-space(string()), "${textToTranslate}", "${translateTo}"), ${xpathText})]`,
  );
}

async function matchValueOrType(
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
) {
  return await $$xpath(
    '//' +
      tagName +
      `[translate(normalize-space(@value), "${textToTranslate}", "${translateTo}")=${xpathText} or translate(normalize-space(@type), "${textToTranslate}", "${translateTo}")=${xpathText}]`,
  );
}

async function containsValueOrType(
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
) {
  return await $$xpath(
    '//' +
      tagName +
      `[contains(translate(normalize-space(@value), "${textToTranslate}", "${translateTo}"), ${xpathText}) or contains(translate(normalize-space(@type), "${textToTranslate}", "${translateTo}"), ${xpathText})]`,
  );
}

async function matchTextAcrossElements(
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
) {
  const xpathToTranslateInnerText = `translate(normalize-space(.), "${textToTranslate}", "${translateTo}")`;
  return await $$xpath(
    '//' +
      tagName +
      `[not(descendant::*[${xpathToTranslateInnerText}=${xpathText}]) and ${xpathToTranslateInnerText}=${xpathText}]`,
  );
}

async function containsTextAcrossElements(
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
) {
  return await $$xpath(
    '//' +
      tagName +
      `[not(descendant::*[contains(translate(normalize-space(.), '${textToTranslate}', '${translateTo}'), ${xpathText})]) and contains(translate(normalize-space(.), '${textToTranslate}', '${translateTo}'), ${xpathText})]`,
  );
}

const containsTextInChildElements = async function (
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
) {
   return await $$xpath(
    '//' +
    tagName +
    `[contains(translate(normalize-space(.), "${textToTranslate}", "${translateTo}"), ${xpathText})]`
  )
}

const filterVisibleNodes = async nodeIds => {
  let visible_nodes = [];
  for (const nodeId of nodeIds) {
    const visible = await isElementVisible(nodeId);
    if (visible) visible_nodes.push(nodeId);
  }
  return visible_nodes;
};

const isElementVisible = async nodeId => {
  function isHidden() {
    let elem = this;
    if (this.nodeType === Node.TEXT_NODE) elem = this.parentElement;
    return !(
      elem.offsetHeight ||
      elem.offsetWidth ||
      elem.getClientRects().length
    );
  }
  return !(await runtimeHandler.runtimeCallFunctionOn(
    isHidden,
    null,
    { nodeId: nodeId, returnByValue: true },
  )).result.value;
};

const $$ = async selector => {
  return await filterVisibleNodes(
    await runtimeHandler.findElements(
      `document.querySelectorAll('${selector}')`,
    ),
  );
};

const $$xpath = async (selector, selectHiddenElements) => {
  var xpathFunc = function(selector) {
    var result = [];
    var nodesSnapshot = document.evaluate(
      selector,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    );
    for (var i = 0; i < nodesSnapshot.snapshotLength; i++) {
      result.push(nodesSnapshot.snapshotItem(i));
    }
    return result;
  };
  const elements = await runtimeHandler.findElements(
    xpathFunc,
    selector,
  );
  return selectHiddenElements
    ? elements
    : await filterVisibleNodes(elements);
};

const isSelector = obj => obj && obj['get'] && obj['exists'];

const element = async (selector, tag) =>
  (await elements(selector, tag))[0];

const elements = async (selector, tag) => {
  const elements = await (() => {
    if (isString(selector)) {
      return match(selector).get(tag);
    } else if (isSelector(selector)) {
      return selector.get(tag);
    }
    return null;
  })();
  if (!elements || !elements.length) {
    const error = isString(selector)
      ? `Element with text ${selector} not found`
      : `${selector.description} not found`;
    throw new Error(error);
  }
  return elements;
};

module.exports = {
  match,
  $$xpath,
  $$,
  element,
  elements,
  isSelector,
  isElementVisible,
};
