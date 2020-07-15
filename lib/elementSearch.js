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
    const textSearch = function (args) {
      function iterateNodesForResult(nodesSnapshot) {
        let result = [];
        for (var i = 0; i < nodesSnapshot.snapshotLength; i++) {
          result.push(nodesSnapshot.snapshotItem(i));
        }
        return result;
      }

      function evalXpath(selector) {
        return document.evaluate(
          selector,
          document,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null,
        );
      }

      function convertQuotes(s) {
        return `concat(${
          s
            .match(/[^'"]+|['"]/g)
            .map((part) => {
              if (part === "'") {
                return '"\'"';
              }
              if (part === '"') {
                return "'\"'";
              }
              return "'" + part + "'";
            })
            .join(',') + ', ""'
        })`;
      }

      const nbspChar = String.fromCharCode(160);
      const textToTranslate = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + nbspChar;
      const translateTo = 'abcdefghijklmnopqrstuvwxyz' + ' ';
      const xpathText = `translate(normalize-space(${convertQuotes(
        args.text,
      )}), "${textToTranslate}", "${translateTo}")`;

      let exactMatchXpath = `//${args.tagName}[translate(normalize-space(@value), "${textToTranslate}", "${translateTo}")=${xpathText} or translate(normalize-space(@type), "${textToTranslate}", "${translateTo}")=${xpathText}]`;
      exactMatchXpath =
        args.tagName === '*'
          ? `//text()[translate(normalize-space(string()), "${textToTranslate}", "${translateTo}")=${xpathText}]| ${exactMatchXpath}`
          : exactMatchXpath;

      const exactMatchAcrossElement = `//${args.tagName}[not(descendant::*[translate(normalize-space(.), "${textToTranslate}", "${translateTo}")=${xpathText}]) and translate(normalize-space(.), "${textToTranslate}", "${translateTo}")=${xpathText}]`;

      let containsXpath = `//${args.tagName}[contains(translate(normalize-space(@value), "${textToTranslate}", "${translateTo}"), ${xpathText}) or contains(translate(normalize-space(@type), "${textToTranslate}", "${translateTo}"), ${xpathText})]`;
      containsXpath =
        args.tagName === '*'
          ? `//text()[contains(translate(normalize-space(string()), "${textToTranslate}", "${translateTo}"), ${xpathText})]| ${containsXpath}`
          : containsXpath;

      const containsMatchAcrossElement = `//${args.tagName}[not(descendant::*[contains(translate(normalize-space(.), '${textToTranslate}', '${translateTo}'), ${xpathText})]) and contains(translate(normalize-space(.), '${textToTranslate}', '${translateTo}'), ${xpathText})]`;

      const containsButtonTextInChild = `//${args.tagName}[contains(translate(normalize-space(.), "${textToTranslate}", "${translateTo}"), ${xpathText})]`;

      //find exact match
      let nodesSnapshot = evalXpath(exactMatchXpath);
      let matchingElements = nodesSnapshot.snapshotLength
        ? iterateNodesForResult(nodesSnapshot)
        : iterateNodesForResult(evalXpath(exactMatchAcrossElement));
      if (args.exactMatch || matchingElements.length) {
        return matchingElements;
      }

      //find contains
      nodesSnapshot = evalXpath(containsXpath);
      matchingElements = nodesSnapshot.snapshotLength
        ? iterateNodesForResult(nodesSnapshot)
        : iterateNodesForResult(evalXpath(containsMatchAcrossElement));

      if (args.tagName === 'button' && !matchingElements.length) {
        return iterateNodesForResult(evalXpath(containsButtonTextInChild));
      }

      return matchingElements;
    };

    elements = Element.create(
      await runtimeHandler
        .findElements(textSearch, {
          text: text,
          exactMatch: options.exactMatch,
          tagName: tagName,
        })
        .catch(console.log),
      runtimeHandler,
    );
    elements = options.selectHiddenElements ? elements : await filterVisibleNodes(elements);
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

const $function = async (callBack, args, selectHiddenElements) => {
  const elements = Element.create(
    await runtimeHandler.findElements(callBack, args),
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
