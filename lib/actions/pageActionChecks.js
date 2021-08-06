const { isElement, isSelector, isString, waitUntil } = require('../helper');
const runtimeHandler = require('../handlers/runtimeHandler');
const { findElements, waitAndGetFocusedElement } = require('../elementSearch');
const { handleRelativeSearch } = require('../proximityElementSearch');
const { defaultConfig } = require('../config');
const { scrollToElement } = require('./scrollTo');

const checkVisible = async (elem) => {
  return await elem.isVisible();
};

const checkNotDisabled = async (elem) => {
  return !(await elem.isDisabled());
};

const checkWritable = async (elem) => {
  return await elem.isWritable();
};

const checkConnected = async (elem) => {
  return await elem.isConnected();
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

const checkStable = async (elem) => {
  function waitForElementToBeStable() {
    let elem = this;
    return new Promise((resolve, reject) => {
      setTimeout(() => reject(false), 10000);
      let previousRect, currentRect;
      function isInSamePosition(previousRect, currentRect) {
        const topDiff = Math.abs(previousRect.top - currentRect.top);
        const leftDiff = Math.abs(previousRect.left - currentRect.left);
        const bottomDiff = Math.abs(previousRect.bottom - currentRect.bottom);
        const rightDiff = Math.abs(previousRect.right - currentRect.right);
        return topDiff + leftDiff + bottomDiff + rightDiff;
      }
      (function step() {
        if (elem.nodeType === Node.TEXT_NODE) {
          let range = document.createRange();
          range.selectNodeContents(elem);
          currentRect = range.getClientRects()[0];
          elem = elem.parentElement;
        } else {
          currentRect = elem.getBoundingClientRect();
        }
        if (previousRect === undefined) {
          previousRect = currentRect;
          window.requestAnimationFrame(step);
        }

        const positionalDiff = isInSamePosition(previousRect, currentRect);
        if (positionalDiff) {
          previousRect = currentRect;
          window.requestAnimationFrame(step);
        } else {
          resolve(true);
        }
      })();
    });
  }

  const objectId = elem.get();
  const res = await runtimeHandler.runtimeCallFunctionOn(waitForElementToBeStable, null, {
    objectId: objectId,
    awaitPromise: true,
  });
  return res.result.value;
};

const checksMap = {
  visible: { predicate: checkVisible, error: 'is not visible' },
  disabled: { predicate: checkNotDisabled, error: 'is disabled' },
  covered: { predicate: checkIfElementIsNotCovered, error: 'is covered by other element' },
  writable: { predicate: checkWritable, error: 'is not writable' },
  connected: { predicate: checkConnected, error: 'is not connected to DOM' },
  stable: { predicate: checkStable, error: 'is not stable' },
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

const defaultChecks = [
  checksMap.visible,
  checksMap.disabled,
  checksMap.connected,
  checksMap.stable,
];

const waitAndGetActionableElement = async (selector, force, checks = defaultChecks, args = []) => {
  checks = [...new Set([...checks, ...defaultChecks])];
  let elements, elementsLength;
  if (selector) {
    elements = await handleRelativeSearch(await findElements(selector), args);
    elementsLength = elements.length;
    if (elementsLength > defaultConfig.noOfElementToMatch) {
      elements.splice(defaultConfig.noOfElementToMatch, elements.length);
    }
  }
  let actionable, error, actionableElement;
  await waitUntil(
    async () => {
      if (!selector) {
        elements = await waitAndGetFocusedElement();
        elementsLength = elements.length;
      }
      for (let elem of elements) {
        try {
          ({ actionable, error } = await checkIfActionable(elem, checks));
          if (!actionable) {
            await scrollToElement(elem);
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
    if (force) {
      actionableElement = elements[0];
      return;
    }
    if (elementsLength !== elements.length) {
      throw Error('Found too many matches. Please use a selector that is more specific');
    }
    throw new Error(`${description(selector)}${error}`);
  });
  return actionableElement;
};

const description = (selector, lowerCase = false) => {
  const d = (() => {
    if (!selector) {
      return 'Element focused ';
    }
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
