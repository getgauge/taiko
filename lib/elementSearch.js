const { assertType, isString, waitUntil, isSelector, isElement } = require('./helper');
const { determineRetryInterval, determineRetryTimeout } = require('./config');
const runtimeHandler = require('./handlers/runtimeHandler');
const { handleRelativeSearch } = require('./proximityElementSearch');
const Element = require('./elements/element');
const { logQuery } = require('./logger');

function match(text, options = {}, ...args) {
  assertType(text);
  const get = async (tagName = '*') => {
    let elements;
    const textSearch = function (selectorElement, args) {
      const iterator = document.createNodeIterator(selectorElement, NodeFilter.SHOW_ALL);
      const exactMatches = [],
        containsMatches = [];
      try {
        let node = iterator.nextNode();
        while (node) {
          if (node.textContent && node.textContent.toLowerCase() === args.text.toLowerCase()) {
            exactMatches.push(node);
          } else if (
            node.textContent &&
            node.textContent.toLowerCase().includes(args.text.toLowerCase())
          ) {
            containsMatches.push(node);
          }
          node = iterator.nextNode();
        }
      } catch (error) {
        console.log(error);
      }
      // console.log(containsMatches);
      return exactMatches.length ? exactMatches : containsMatches;
    };

    elements = await $function(textSearch, { text, tagName }, options.selectHiddenElements);
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

function typeEqual(type) {
  return `translate(@type, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='${type}'`;
}

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
  function customCssQuerySelector(selectorElement, args) {
    return selectorElement.querySelectorAll(args);
  }
  return await $function(customCssQuerySelector, selector, selectHiddenElements);
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

const $function = async (callBack, args, selectHiddenElements) => {
  function searchThroughShadowDom(argument) {
    const isString = (obj) => typeof obj === 'string' || obj instanceof String;
    let { searchElement, querySelector, args, elements } = argument;
    if (isString(querySelector)) {
      eval(`querySelector = ${querySelector}`);
    }
    if (searchElement === null) {
      searchElement = document;
    }
    elements = elements.concat(Array.from(querySelector(searchElement, args)));
    const searchElements = searchElement.querySelectorAll('*');
    for (const element of searchElements) {
      if (element.shadowRoot) {
        elements = searchThroughShadowDom({
          searchElement: element.shadowRoot,
          querySelector: querySelector,
          args: args,
          elements: elements,
        });
      }
    }
    return elements;
  }
  const elements = Element.create(
    await runtimeHandler.findElements(searchThroughShadowDom, {
      querySelector: callBack.toString(),
      args: args,
      searchElement: null,
      elements: [],
    }),
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
  $function,
  findFirstElement,
  findElements,
  isSelector,
  isElement,
  getIfExists,
  typeEqual,
};
