const { xpath, assertType, isString, waitUntil, isSelector, isElement } = require('./helper');
const { determineRetryInterval, determineRetryTimeout } = require('./config');
const runtimeHandler = require('./handlers/runtimeHandler');
const { handleRelativeSearch } = require('./proximityElementSearch');
const Element = require('./elements/element');
const { logQuery } = require('./logger');

function match(text, selectHiddenElement, ...args) {
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
    if (!elements || !elements.length) {
      elements = await matchContainsElements(
        tagName,
        textToTranslate,
        translateTo,
        xpathText,
        selectHiddenElement,
      );
    }
    return await handleRelativeSearch(elements, args);
  };
  const description = `Element matching text "${text}"`;
  return {
    get: async function(tag, retryInterval, retryTimeout) {
      console.warn('DEPRECATED use .elements()');
      return this.elements(tag, retryInterval, retryTimeout);
    },
    description,
    elements: getIfExists(get, description),
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
  if (tagName === '*') {
    elements = await matchTextNode(textToTranslate, translateTo, xpathText, selectHiddenElement);
  }
  let valueAndTypeElements = await matchValueOrType(
    tagName,
    textToTranslate,
    translateTo,
    xpathText,
    selectHiddenElement,
  );
  if (valueAndTypeElements.length) {
    elements = elements.concat(valueAndTypeElements);
  }
  if (!elements || !elements.length) {
    elements = await matchTextAcrossElements(
      tagName,
      textToTranslate,
      translateTo,
      xpathText,
      selectHiddenElement,
    );
  }
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
  if (tagName === '*') {
    elements = await containsTextNode(textToTranslate, translateTo, xpathText, selectHiddenElement);
  }
  let valueAndTypeElements = await containsValueOrType(
    tagName,
    textToTranslate,
    translateTo,
    xpathText,
    selectHiddenElement,
  );
  if (valueAndTypeElements.length) {
    elements = elements.concat(valueAndTypeElements);
  }
  if (!elements || !elements.length) {
    elements = await containsTextAcrossElements(
      tagName,
      textToTranslate,
      translateTo,
      xpathText,
      selectHiddenElement,
    );
  }
  if (tagName === 'button' && (!elements || !elements.length)) {
    elements = await containsTextInChildElements(
      tagName,
      textToTranslate,
      translateTo,
      xpathText,
      selectHiddenElement,
    );
  }
  return elements;
}

async function matchTextNode(textToTranslate, translateTo, xpathText, selectHiddenElement) {
  return await $$xpath(
    `//text()[translate(normalize-space(string()), "${textToTranslate}", "${translateTo}")=${xpathText}]`,
    selectHiddenElement,
  );
}

async function containsTextNode(textToTranslate, translateTo, xpathText, selectHiddenElement) {
  return await $$xpath(
    `//text()[contains(translate(normalize-space(string()), "${textToTranslate}", "${translateTo}"), ${xpathText})]`,
    selectHiddenElement,
  );
}

async function matchValueOrType(
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
  selectHiddenElement,
) {
  return await $$xpath(
    '//' +
      tagName +
      `[translate(normalize-space(@value), "${textToTranslate}", "${translateTo}")=${xpathText} or translate(normalize-space(@type), "${textToTranslate}", "${translateTo}")=${xpathText}]`,
    selectHiddenElement,
  );
}

async function containsValueOrType(
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
  selectHiddenElement,
) {
  return await $$xpath(
    '//' +
      tagName +
      `[contains(translate(normalize-space(@value), "${textToTranslate}", "${translateTo}"), ${xpathText}) or contains(translate(normalize-space(@type), "${textToTranslate}", "${translateTo}"), ${xpathText})]`,
    selectHiddenElement,
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
  return await $$xpath(
    '//' +
      tagName +
      `[not(descendant::*[${xpathToTranslateInnerText}=${xpathText}]) and ${xpathToTranslateInnerText}=${xpathText}]`,
    selectHiddenElement,
  );
}

async function containsTextAcrossElements(
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
  selectHiddenElement,
) {
  return await $$xpath(
    '//' +
      tagName +
      `[not(descendant::*[contains(translate(normalize-space(.), '${textToTranslate}', '${translateTo}'), ${xpathText})]) and contains(translate(normalize-space(.), '${textToTranslate}', '${translateTo}'), ${xpathText})]`,
    selectHiddenElement,
  );
}

const containsTextInChildElements = async function(
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
  selectHiddenElement,
) {
  return await $$xpath(
    '//' +
      tagName +
      `[contains(translate(normalize-space(.), "${textToTranslate}", "${translateTo}"), ${xpathText})]`,
    selectHiddenElement,
  );
};

const filterVisibleNodes = async elements => {
  let visible_nodes = [];
  for (const element of elements) {
    const visible = await element.isVisible();
    if (visible) {
      visible_nodes.push(element);
    }
  }
  return visible_nodes;
};

const $$ = async selector => {
  logQuery(`document.querySelectorAll('${selector}')`);
  const elements = Element.create(
    await runtimeHandler.findElements(`document.querySelectorAll('${selector}')`),
    runtimeHandler,
  );
  return await filterVisibleNodes(elements);
};

const $$xpath = async (selector, selectHiddenElements) => {
  logQuery(`xpath - ${selector}`);
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
  const elements = Element.create(
    await runtimeHandler.findElements(xpathFunc, selector),
    runtimeHandler,
  );
  return selectHiddenElements ? elements : await filterVisibleNodes(elements);
};

const findFirstElement = async (selector, tag) => {
  return (await findElements(selector, tag))[0];
};

const findElements = async (selector, tag) => {
  const elements = await (async () => {
    if (isString(selector)) {
      return match(selector).elements(tag);
    } else if (isSelector(selector)) {
      return selector.elements();
    } else if (isElement(selector)) {
      return [selector];
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

const getIfExists = (get, description, customFuncs = {}) => {
  return async (tag, retryInterval, retryTimeout) => {
    retryInterval = determineRetryInterval(retryInterval);
    retryTimeout = determineRetryTimeout(retryTimeout);
    try {
      let nodeIds = [];
      await waitUntil(
        async () => {
          nodeIds = await get(tag);
          return nodeIds.length > 0;
        },
        retryInterval,
        retryTimeout,
      );
      nodeIds = nodeIds.length ? nodeIds : await get(tag);
      return nodeIds.map(nodeId => Object.assign(nodeId, { description }, customFuncs));
    } catch (e) {
      return [];
    }
  };
};
module.exports = {
  match,
  $$xpath,
  $$,
  findFirstElement,
  findElements,
  isSelector,
  isElement,
  getIfExists,
};
