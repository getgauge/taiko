const { isElement, isSelector, isString } = require('../helper');
// const checksMap = {
//   visible: checkVisible,
//   disabled: checkDisabled,
//   covered: checkCovered,
// };

// const waitForElementToBeActionable = async (elements) => {};

// const checkIfActionable = async (checks) => {
//   let actionable = true;
//   for (let check of checks) {
//     actionable = checksMap[check]();
//     if (!actionable) {
//       break;
//     }
//   }
//   return actionable;
// };

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

module.exports = { description };
