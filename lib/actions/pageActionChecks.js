const { isElement, isSelector, isString, waitUntil } = require('../helper');
const { findElements } = require('../elementSearch');
const { defaultConfig } = require('../config');

const checkVisible = async (elem) => {
  return await elem.isVisible();
};
const checkNotDisabled = async (elem) => {
  return !(await elem.isDisabled());
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

const waitForElementToBeActionable = async (selector, checks = ['visible', 'disabled']) => {
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
        elements,
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

module.exports = { description, waitForElementToBeActionable };
