const {
  assertType,
  isString,
  waitUntil,
  isSelector,
  isElement,
  isRegex,
} = require("./helper");
const {
  determineRetryInterval,
  determineRetryTimeout,
  defaultConfig,
} = require("./config");
const runtimeHandler = require("./handlers/runtimeHandler");
const { handleRelativeSearch } = require("./proximityElementSearch");
const Element = require("./elements/element");
const { logQuery } = require("./logger");

function match(text, options = {}, ...args) {
  assertType(
    text,
    (obj) => isString(obj) || isRegex(obj),
    "String or regex is expected",
  );
  const get = async (tagName = "*") => {
    const textSearch = (selectorElement, args) => {
      const isRegex = (obj) =>
        Object.prototype.toString.call(obj).includes("RegExp");

      const searchText =
        args.text[0] === "/" && args.text.lastIndexOf("/") > 0
          ? new RegExp(
              args.text.substring(1, args.text.lastIndexOf("/")),
              args.text.substring(args.text.lastIndexOf("/") + 1),
            )
          : args.text
              .toLowerCase()
              .replace(
                /\s+/g /* all kinds of spaces*/,
                " " /* ordinary space */,
              )
              .trim();

      const nodeFilter =
        args.tagName === "*"
          ? {
              acceptNode(node) {
                //Filter nodes that need not be searched for text
                return [
                  "head",
                  "script",
                  "style",
                  "html",
                  "body",
                  "#comment",
                ].includes(node.nodeName.toLowerCase())
                  ? NodeFilter.FILTER_REJECT
                  : NodeFilter.FILTER_ACCEPT;
              },
            }
          : {
              acceptNode(node) {
                //Filter nodes that match tagName
                return args.tagName.toLowerCase() ===
                  node.nodeName.toLowerCase()
                  ? NodeFilter.FILTER_ACCEPT
                  : NodeFilter.FILTER_REJECT;
              },
            };

      const iterator = document.createNodeIterator(
        selectorElement,
        NodeFilter.SHOW_ALL,
        nodeFilter,
      );

      const exactMatches = [];
      const containsMatches = [];

      function checkIfRegexMatch(text, searchText, exactMatch) {
        return exactMatch
          ? isRegex(searchText) &&
              text &&
              text.match(searchText) &&
              text.match(searchText)[0] === text
          : isRegex(searchText) && text && text.match(searchText);
      }

      function normalizeText(text) {
        return text
          ? text
              .toLowerCase()
              .replace(
                /\s+/g /* all kinds of spaces*/,
                " " /* ordinary space */,
              )
              .trim()
          : "";
      }

      function checkIfChildHasMatch(childNodes, exactMatch) {
        if (args.tagName !== "*") {
          return;
        }
        if (childNodes.length) {
          for (const childNode of childNodes) {
            const nodeTextContent = normalizeText(childNode.textContent);
            if (
              exactMatch &&
              (checkIfRegexMatch(childNode.textContent, searchText, true) ||
                nodeTextContent === searchText)
            ) {
              return true;
            }
            if (
              checkIfRegexMatch(childNode.textContent, searchText, false) ||
              (!isRegex(searchText) && nodeTextContent.includes(searchText))
            ) {
              return true;
            }
          }
        }
        return false;
      }

      let node;
      // biome-ignore lint/suspicious/noAssignInExpressions: No other way to do this
      while ((node = iterator.nextNode())) {
        const nodeTextContent = normalizeText(node.textContent);

        //Match values and types for Input and Button nodes
        if (node.nodeName === "INPUT") {
          const nodeValue = normalizeText(node.value);
          if (
            // Exact match of values and types
            checkIfRegexMatch(node.value, searchText, true) ||
            nodeValue === searchText ||
            (["submit", "reset"].includes(node.type.toLowerCase()) &&
              node.type.toLowerCase() === searchText)
          ) {
            exactMatches.push(node);
            continue;
          } else if (
            // Contains match of values and types
            !args.exactMatch &&
            (checkIfRegexMatch(node.value, searchText, false) ||
              (!isRegex(searchText) &&
                (nodeValue.includes(searchText) ||
                  (["submit", "reset"].includes(node.type.toLowerCase()) &&
                    node.type.toLowerCase().includes(searchText)))))
          ) {
            containsMatches.push(node);
            continue;
          }
        }

        // Exact match of textContent for other nodes
        if (
          checkIfRegexMatch(node.textContent, searchText, true) ||
          nodeTextContent === searchText
        ) {
          const childNodesHasMatch = checkIfChildHasMatch(
            [...node.childNodes],
            true,
          );
          if (childNodesHasMatch) {
            continue;
          }
          exactMatches.push(node);
        } else if (
          //Contains match of textContent for other nodes
          !args.exactMatch &&
          (checkIfRegexMatch(node.textContent, searchText, false) ||
            (!isRegex(searchText) && nodeTextContent.includes(searchText)))
        ) {
          const childNodesHasMatch = checkIfChildHasMatch(
            [...node.childNodes],
            false,
          );
          if (childNodesHasMatch) {
            continue;
          }
          containsMatches.push(node);
        }
      }

      return exactMatches.length ? exactMatches : containsMatches;
    };

    const elements = await $function(textSearch, {
      text: text.toString(),
      tagName,
      exactMatch: options.exactMatch,
    });

    return await handleRelativeSearch(elements, args);
  };

  const description = `Element matching text "${text}"`;
  return {
    get: async function (tag, retryInterval, retryTimeout) {
      console.warn("DEPRECATED use .elements()");
      return this.elements(tag, retryInterval, retryTimeout);
    },
    description,
    elements: getIfExists(get, description),
  };
}

const $$ = async (selector) => {
  logQuery(`document.querySelectorAll('${selector}')`);
  function customCssQuerySelector(selectorElement, args) {
    return selectorElement.querySelectorAll(args);
  }
  return await $function(customCssQuerySelector, selector);
};

const $$xpath = async (selector) => {
  logQuery(`xpath - ${selector}`);
  const xpathFunc = (selector) => {
    const result = [];
    const nodesSnapshot = document.evaluate(
      selector,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    );
    for (let i = 0; i < nodesSnapshot.snapshotLength; i++) {
      result.push(nodesSnapshot.snapshotItem(i));
    }
    return result;
  };
  const elements = Element.create(
    await runtimeHandler.findElements(xpathFunc, selector),
    runtimeHandler,
  );
  return elements;
};

const $function = async (callBack, args) => {
  function searchThroughShadowDom(argument) {
    const isString = (obj) =>
      Object.prototype.toString.call(obj).includes("String");
    let { searchElement, querySelector, args, elements } = argument;
    if (isString(querySelector)) {
      if (typeof querySelector === "string") {
        querySelector = new Function(`return ${querySelector}`)();
      }
    }
    if (searchElement === null) {
      searchElement = document;
    }
    elements = elements.concat(Array.from(querySelector(searchElement, args)));
    const searchElements = searchElement.querySelectorAll("*");
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
  return elements;
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

const findActiveElement = async () => {
  const getActiveElement = () => {
    let activeElement = document.activeElement;
    const parsedShadowRoots = [];
    while (
      activeElement.shadowRoot &&
      !parsedShadowRoots.includes(activeElement.shadowRoot)
    ) {
      parsedShadowRoots.push(activeElement.shadowRoot);
      activeElement = activeElement.shadowRoot.activeElement;
    }
    return activeElement;
  };

  const activeElementObjectIds =
    await runtimeHandler.findElements(getActiveElement);
  const elements = Element.create(activeElementObjectIds, runtimeHandler);
  return elements;
};

const waitAndGetFocusedElement = async () => {
  let activeElement;
  await waitUntil(
    async () => {
      try {
        activeElement = await findActiveElement();
        return activeElement.length;
      } catch (e) {
        if (e.message.match(/Browser process with pid \d+ exited with/)) {
          throw e;
        }
      }
    },
    defaultConfig.retryInterval,
    defaultConfig.retryTimeout,
  ).catch(() => {
    throw new Error(
      "There is no element focused, provide an appropriate selector.",
    );
  });
  return activeElement;
};

const getIfExists = (findElements, description, customFuncs = {}) => {
  return async (tag, retryInterval, retryTimeout) => {
    const _retryInterval = determineRetryInterval(retryInterval);
    const _retryTimeout = determineRetryTimeout(retryTimeout);
    try {
      let elements = [];
      await waitUntil(
        async () => {
          elements = await findElements(tag);
          return elements.length > 0;
        },
        _retryInterval,
        _retryTimeout,
      );
      elements = elements.length ? elements : await findElements(tag);
      return elements.map((element) =>
        Object.assign(element, { description }, customFuncs),
      );
    } catch (e) {
      if (e.message.includes("waiting failed: retryTimeout")) {
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
  waitAndGetFocusedElement,
  getIfExists,
};
