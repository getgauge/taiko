const { xpath, assertType, isString, waitUntil, isSelector, isElement } = require('./helper');
const { determineRetryInterval, determineRetryTimeout } = require('./config');
const runtimeHandler = require('./handlers/runtimeHandler');
const { handleRelativeSearch } = require('./proximityElementSearch');
const Element = require('./elements/element');
const { logQuery } = require('./logger');

function match(text, options = {}, ...args) {
  assertType(text);
  const get = async (tagName = '*') => {
    let elements;
    let nbspChar = String.fromCharCode(160);
    let textToTranslate = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + nbspChar;
    let translateTo = 'abcdefghijklmnopqrstuvwxyz' + ' ';
    let xpathText = `translate(normalize-space(${xpath(
      text,
    )}), "${textToTranslate}", "${translateTo}")`;

    if (options.exactMatch) {
      elements = await matchExactElements(
        tagName,
        textToTranslate,
        translateTo,
        xpathText,
        options.selectHiddenElements,
      );
      return await handleRelativeSearch(elements, args);
    }

    elements = await matchExactElements(
      tagName,
      textToTranslate,
      translateTo,
      xpathText,
      options.selectHiddenElements,
    );
    if (!elements || !elements.length) {
      elements = await matchContainsElements(
        tagName,
        textToTranslate,
        translateTo,
        xpathText,
        options.selectHiddenElements,
      );
    }
    return await handleRelativeSearch(elements, args);
  };
  const description = `Element matching text "${text}"`;
  return {
    get: async function (tag, retryInterval, retryTimeout) {
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
  selectHiddenElements,
) {
  let elements = [];
  if (tagName === '*') {
    elements = await matchTextNode(textToTranslate, translateTo, xpathText, selectHiddenElements);
  }
  let valueAndTypeElements = await matchValueOrType(
    tagName,
    textToTranslate,
    translateTo,
    xpathText,
    selectHiddenElements,
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
      selectHiddenElements,
    );
  }
  return elements;
}

async function matchContainsElements(
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
  selectHiddenElements,
) {
  let elements;
  if (tagName === '*') {
    elements = await containsTextNode(textToTranslate, translateTo, xpathText, selectHiddenElements);
  }
  let valueAndTypeElements = await containsValueOrType(
    tagName,
    textToTranslate,
    translateTo,
    xpathText,
    selectHiddenElements,
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
      selectHiddenElements,
    );
  }
  if (tagName === 'button' && (!elements || !elements.length)) {
    elements = await containsTextInChildElements(
      tagName,
      textToTranslate,
      translateTo,
      xpathText,
      selectHiddenElements,
    );
  }
  return elements;
}

async function matchTextNode(textToTranslate, translateTo, xpathText, selectHiddenElements) {
  return await $$xpath(
    `//text()[translate(normalize-space(string()), "${textToTranslate}", "${translateTo}")=${xpathText}]`,
    selectHiddenElements,
  );
}

async function containsTextNode(textToTranslate, translateTo, xpathText, selectHiddenElements) {
  return await $$xpath(
    `//text()[contains(translate(normalize-space(string()), "${textToTranslate}", "${translateTo}"), ${xpathText})]`,
    selectHiddenElements,
  );
}

function typeEqual(type) {
  return `translate(@type, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='${type}'`;
}

async function matchValueOrType(
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
  selectHiddenElements,
) {
  return await $$xpath(
    '//' +
      tagName +
      `[translate(normalize-space(@value), "${textToTranslate}", "${translateTo}")=${xpathText} or translate(normalize-space(@type), "${textToTranslate}", "${translateTo}")=${xpathText}]`,
    selectHiddenElements,
  );
}

async function containsValueOrType(
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
  selectHiddenElements,
) {
  return await $$xpath(
    '//' +
      tagName +
      `[contains(translate(normalize-space(@value), "${textToTranslate}", "${translateTo}"), ${xpathText}) or contains(translate(normalize-space(@type), "${textToTranslate}", "${translateTo}"), ${xpathText})]`,
    selectHiddenElements,
  );
}

async function matchTextAcrossElements(
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
  selectHiddenElements,
) {
  const xpathToTranslateInnerText = `translate(normalize-space(.), "${textToTranslate}", "${translateTo}")`;
  return await $$xpath(
    '//' +
      tagName +
      `[not(descendant::*[${xpathToTranslateInnerText}=${xpathText}]) and ${xpathToTranslateInnerText}=${xpathText}]`,
    selectHiddenElements,
  );
}

async function containsTextAcrossElements(
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
  selectHiddenElements,
) {
  return await $$xpath(
    '//' +
      tagName +
      `[not(descendant::*[contains(translate(normalize-space(.), '${textToTranslate}', '${translateTo}'), ${xpathText})]) and contains(translate(normalize-space(.), '${textToTranslate}', '${translateTo}'), ${xpathText})]`,
    selectHiddenElements,
  );
}

const containsTextInChildElements = async function (
  tagName,
  textToTranslate,
  translateTo,
  xpathText,
  selectHiddenElements,
) {
  return await $$xpath(
    '//' +
      tagName +
      `[contains(translate(normalize-space(.), "${textToTranslate}", "${translateTo}"), ${xpathText})]`,
    selectHiddenElements,
  );
};

const filterVisibleNodes = async (elements) => {
  let visible_nodes = [];
  for (const element of elements) {
    const visible = await element.isVisible();
    if (visible) {
      visible_nodes.push(element);
    }
  }
  return visible_nodes;
};

const $$ = async (selector, selectHiddenElements) => {
  logQuery(`document.querySelectorAll('${selector}')`);
  const elements = Element.create(
    await runtimeHandler.findElements(`document.querySelectorAll('${selector}')`),
    runtimeHandler,
  );
  return selectHiddenElements ? elements : await filterVisibleNodes(elements);
};

const $$xpath = async (selector, selectHiddenElements) => {
  logQuery(`xpath - ${selector}`);
  var xpathFunc = function (selector) {
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

const getIfExists = (findElements, description, customFuncs = {}) => {
  return async (tag, retryInterval, retryTimeout) => {
    retryInterval = determineRetryInterval(retryInterval);
    retryTimeout = determineRetryTimeout(retryTimeout);
    try {
      let elements = [];
      await waitUntil(
        async () => {
          elements = await findElements(tag);
          return elements.length > 0;
        },
        retryInterval,
        retryTimeout,
      );
      elements = elements.length ? elements : await findElements(tag);
      return elements.map((element) => Object.assign(element, { description }, customFuncs));
    } catch (e) {
      if (e.message.includes('waiting failed: retryTimeout')) {
        return [];
      }
      throw e;
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
  typeEqual,
};
