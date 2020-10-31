const { isElement, isSelector, isString, waitUntil } = require('../helper');
const runtimeHandler = require('../handlers/runtimeHandler');
const { findElements } = require('../elementSearch');
const { handleRelativeSearch } = require('../proximityElementSearch');
const { defaultConfig } = require('../config');
const { scrollToElement } = require('./scrollTo');

const checkVisible = async (elem) => {
  return await elem.isVisible();
};
const checkNotDisabled = async (elem) => {
  return !(await elem.isDisabled());
};

const checkIfElementIsNotCovered = async (e) => {
  function isElementAtPointOrChild() {
    function getDirectParent(nodes, elem) {
      return nodes.find((node) => node.contains(elem));
    }

    let value,
      elem = this;
    if (elem.nodeType === Node.TEXT_NODE) {
      let range = document.createRange();
      range.selectNodeContents(elem);
      value = range.getClientRects()[0];
      elem = elem.parentElement;
    } else {
      value = elem.getBoundingClientRect();
    }
    const y = (value.top + value.bottom) / 2;
    const x = (value.left + value.right) / 2;

    let nodes = document.elementsFromPoint(x, y);
    const parsedShadowRoots = [];
    while (nodes[0].shadowRoot && !parsedShadowRoots.includes(nodes[0].shadowRoot)) {
      parsedShadowRoots.push(nodes[0].shadowRoot);
      nodes = [nodes[0].shadowRoot.elementFromPoint(x, y)];
    }
    const isElementCoveredByAnotherElement = nodes[0] !== elem;
    let node = null;
    if (isElementCoveredByAnotherElement) {
      node = nodes[0];
    } else {
      node = getDirectParent(nodes, elem);
    }
    return (
      elem.contains(node) ||
      node.contains(elem) ||
      window.getComputedStyle(node).getPropertyValue('opacity') < 0.1 ||
      window.getComputedStyle(elem).getPropertyValue('opacity') < 0.1
    );
  }
  const objectId = e.get();
  const res = await runtimeHandler.runtimeCallFunctionOn(isElementAtPointOrChild, null, {
    objectId: objectId,
  });
  return res.result.value;
};

const checksMap = {
  visible: { predicate: checkVisible, error: 'is not visible' },
  disabled: { predicate: checkNotDisabled, error: 'is disabled' },
  covered: { predicate: checkIfElementIsNotCovered, error: 'is covered by other element' },
};

const checkIfActionable = async (elem, checks) => {
  let actionable = true,
    error;
  for (let check of checks) {
    actionable = await check.predicate(elem);
    if (!actionable) {
      error = check.error;
      break;
    }
  }
  return { actionable, error };
};

const waitAndGetActionableElement = async (
  selector,
  checks = [checksMap.visible, checksMap.disabled],
  args = [],
) => {
  const elements = await handleRelativeSearch(await findElements(selector), args);
  let elementsLength = elements.length;
  if (elementsLength > defaultConfig.noOfElementToMatch) {
    elements.splice(defaultConfig.noOfElementToMatch, elements.length);
  }
  let actionable, error, actionableElement;
  await waitUntil(
    async () => {
      for (let elem of elements) {
        try {
          await scrollToElement(elem);
          ({ actionable, error } = await checkIfActionable(elem, checks));
          if (!actionable) {
            continue;
          }
          actionableElement = elem;
          return true;
        } catch (e) {
          if (e.message.match(/Browser process with pid \d+ exited with/)) {
            throw e;
          }
        }
      }
      return false;
    },
    defaultConfig.retryInterval,
    defaultConfig.retryTimeout,
  ).catch(() => {
    if (elementsLength !== elements.length) {
      throw Error('Found too many matches. Please use a selector that is more specific');
    }
    throw new Error(`${description(selector)}${error}`);
  });
  return actionableElement;
};

const description = (selector, lowerCase = false) => {
  const d = (() => {
    if (isString(selector)) {
      return `Element matching text "${selector}" `;
    } else if (isSelector(selector) || isElement(selector)) {
      return selector.description;
    }
    return '';
  })();
  return lowerCase ? d.charAt(0).toLowerCase() + d.slice(1) : d;
};

module.exports = { description, waitAndGetActionableElement, checksMap };
