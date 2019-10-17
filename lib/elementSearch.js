const {
  xpath,
  assertType,
  getIfExists,
  isString,
} = require('./helper');
const runtimeHandler = require('./handlers/runtimeHandler');
const { handleRelativeSearch } = require('./proximityElementSearch');

function match(text, eventEmitter, selectHiddenElement, ...args) {
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
      selectHiddenElement,
    );
    if (!elements || !elements.length)
      elements = await matchContainsElements(
        tagName,
        textToTranslate,
        translateTo,
        xpathText,
        selectHiddenElement,
      );
    return await handleRelativeSearch(elements, args);
  };
  const description = `Element matching text "${text}"`;
  return {
    get: async (tag, retryInterval, retryTimeout) => {
      console.warn('DEPRECATED use .elements()');
      return await getIfExists(get, description, eventEmitter)(
        tag,
        retryInterval,
        retryTimeout,
      );
    },
    description,
    elements: getIfExists(get, description, eventEmitter),
  };
}

async function matchExactElements(
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
  selectHiddenElement,
) {
  let elements = [];
  if (tagName === '*')
    elements = await matchTextNode(
      textToTranslate,
      translateTo,
      xpathText,
      selectHiddenElement,
    );
  let valueAndTypeElements = await matchValueOrType(
    tagName,
    textToTranslate,
    translateTo,
    xpathText,
    selectHiddenElement,
  );
  if (valueAndTypeElements.length)
    elements = elements.concat(valueAndTypeElements);
  if (!elements || !elements.length)
    elements = await matchTextAcrossElements(
      tagName,
      textToTranslate,
      translateTo,
      xpathText,
      selectHiddenElement,
    );
  return elements;
}

async function matchContainsElements(
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
  selectHiddenElement,
) {
  let elements;
  if (tagName === '*')
    elements = await containsTextNode(
      textToTranslate,
      translateTo,
      xpathText,
      selectHiddenElement,
    );
  let valueAndTypeElements = await containsValueOrType(
    tagName,
    textToTranslate,
    translateTo,
    xpathText,
    selectHiddenElement,
  );
  if (valueAndTypeElements.length)
    elements = elements.concat(valueAndTypeElements);
  if (!elements || !elements.length)
    elements = await containsTextAcrossElements(
      tagName,
      textToTranslate,
      translateTo,
      xpathText,
      selectHiddenElement,
    );
  if (tagName === 'button' && (!elements || !elements.length))
    elements = await containsTextInChildElements(
      tagName,
      textToTranslate,
      translateTo,
      xpathText,
      selectHiddenElement,
    );
  return elements;
}

async function matchTextNode(
  textToTranslate,
  translateTo,
  xpathText,
  selectHiddenElement,
) {
  return selectHiddenElement
    ? await $$xpath(
        `//text()[translate(normalize-space(string()), "${textToTranslate}", "${translateTo}")=${xpathText}]`,
        selectHiddenElement,
      )
    : await $$xpath(
        `//text()[translate(normalize-space(string()), "${textToTranslate}", "${translateTo}")=${xpathText}]`,
      );
}

async function containsTextNode(
  textToTranslate,
  translateTo,
  xpathText,
  selectHiddenElement,
) {
  return selectHiddenElement
    ? await $$xpath(
        `//text()[contains(translate(normalize-space(string()), "${textToTranslate}", "${translateTo}"), ${xpathText})]`,
        selectHiddenElement,
      )
    : await $$xpath(
        `//text()[contains(translate(normalize-space(string()), "${textToTranslate}", "${translateTo}"), ${xpathText})]`,
      );
}

async function matchValueOrType(
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
  selectHiddenElement,
) {
  return selectHiddenElement
    ? await $$xpath(
        '//' +
          tagName +
          `[translate(normalize-space(@value), "${textToTranslate}", "${translateTo}")=${xpathText} or translate(normalize-space(@type), "${textToTranslate}", "${translateTo}")=${xpathText}]`,
        selectHiddenElement,
      )
    : await $$xpath(
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
  selectHiddenElement,
) {
  return selectHiddenElement
    ? await $$xpath(
        '//' +
          tagName +
          `[contains(translate(normalize-space(@value), "${textToTranslate}", "${translateTo}"), ${xpathText}) or contains(translate(normalize-space(@type), "${textToTranslate}", "${translateTo}"), ${xpathText})]`,
        selectHiddenElement,
      )
    : await $$xpath(
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
  selectHiddenElement,
) {
  const xpathToTranslateInnerText = `translate(normalize-space(.), "${textToTranslate}", "${translateTo}")`;
  return selectHiddenElement
    ? await $$xpath(
        '//' +
          tagName +
          `[not(descendant::*[${xpathToTranslateInnerText}=${xpathText}]) and ${xpathToTranslateInnerText}=${xpathText}]`,
        selectHiddenElement,
      )
    : await $$xpath(
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
  selectHiddenElement,
) {
  return selectHiddenElement
    ? await $$xpath(
        '//' +
          tagName +
          `[not(descendant::*[contains(translate(normalize-space(.), '${textToTranslate}', '${translateTo}'), ${xpathText})]) and contains(translate(normalize-space(.), '${textToTranslate}', '${translateTo}'), ${xpathText})]`,
        selectHiddenElement,
      )
    : await $$xpath(
        '//' +
          tagName +
          `[not(descendant::*[contains(translate(normalize-space(.), '${textToTranslate}', '${translateTo}'), ${xpathText})]) and contains(translate(normalize-space(.), '${textToTranslate}', '${translateTo}'), ${xpathText})]`,
      );
}

const containsTextInChildElements = async function(
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
  selectHiddenElement,
) {
  return selectHiddenElement
    ? await $$xpath(
        '//' +
          tagName +
          `[contains(translate(normalize-space(.), "${textToTranslate}", "${translateTo}"), ${xpathText})]`,
        selectHiddenElement,
      )
    : await $$xpath(
        '//' +
          tagName +
          `[contains(translate(normalize-space(.), "${textToTranslate}", "${translateTo}"), ${xpathText})]`,
      );
};

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

const element = async (selector, tag) => {
  const elem = (await elements(selector, tag))[0];
  if (isFinite(elem)) {
    return elem;
  }
  return await elem.get();
};

const elements = async (selector, tag) => {
  const elements = await (async () => {
    if (isString(selector)) {
      return match(selector).elements(tag);
    } else if (isSelector(selector)) {
      return selector.elements
        ? selector.elements(tag)
        : [await selector.get()];
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
