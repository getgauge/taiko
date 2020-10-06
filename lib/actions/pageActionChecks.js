const { isElement, isSelector, isString, waitUntil } = require('../helper');
const runtimeHandler = require('../handlers/runtimeHandler');
const { findElements } = require('../elementSearch');
const { defaultConfig } = require('../config');

const checkVisible = async (elem) => {
  return await elem.isVisible();
};
const checkNotDisabled = async (elem) => {
  return !(await elem.isDisabled());
};

const checkIfElementIsCovered = async (e) => {
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
  visible: checkVisible,
  disabled: checkNotDisabled,
};

const checkIfActionable = async (elem, checks) => {
  let actionable = true;
  for (let check of checks) {
    actionable = await checksMap[check](elem);
    if (!actionable) {
      break;
    }
  }
  return actionable;
};

const waitAndGetActionableElement = async (selector, checks = ['visible', 'disabled']) => {
  const elements = await findElements(selector);
  let actionable, actionableElement;
  await waitUntil(
    async () => {
      for (let elem of elements) {
        try {
          actionable = await checkIfActionable(elem, checks);
          if (!actionable) {
            continue;
          }
          actionableElement = elem;
          return true;
        } catch (e) {
          console.log(e);
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
    throw new Error(
      `${description(
        selector,
      )} is not actionable. Check failed for anyone of the following cases ${checks}`,
    );
  });
  return actionableElement;
};

const description = (selector, lowerCase = false) => {
  const d = (() => {
    if (isString(selector)) {
      return `Element matching text "${selector}"`;
    } else if (isSelector(selector) || isElement(selector)) {
      return selector.description;
    }
    return '';
  })();
  return lowerCase ? d.charAt(0).toLowerCase() + d.slice(1) : d;
};

module.exports = { description, waitAndGetActionableElement, checkIfElementIsCovered };
