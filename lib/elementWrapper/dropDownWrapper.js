const DropDown = require('../elements/dropDown');
const ValueWrapper = require('./valueWrapper');
const { firstElement, getElementGetter } = require('./helper');
const { $function } = require('../elementSearch');

function getDropDownElementWithLabel(searchElement, label) {
  const fileField = [];
  function checkAndPushElement(elem) {
    if (elem.tagName && elem.tagName.toLowerCase() == 'select') {
      fileField.push(elem);
    }
  }
  const matchingLabels = [...searchElement.querySelectorAll('label')].filter((labelElem) => {
    return labelElem.innerText.toLowerCase().includes(label.toLowerCase());
  });
  for (let matchingLabel of matchingLabels) {
    const labelFor = matchingLabel.getAttribute('for');
    if (labelFor) {
      //check label with attribute for
      const labelForElement = searchElement.getElementById(labelFor);
      checkAndPushElement(labelForElement);
    } else {
      // check child node of label tag
      matchingLabel.childNodes.forEach((elem) => {
        checkAndPushElement(elem);
      });
    }
  }
  return fileField;
}

/**
 * Behaves the same as ElementWrapper, but for {@link DropDown} element.
 * @extends {ElementWrapper}
 */
class DropDownWrapper extends ValueWrapper {
  constructor(attrValuePairs, _options, ...args) {
    super('DropDown', 'label', attrValuePairs, _options, ...args);
    this._get = getElementGetter(
      this.selector,
      async () =>
        await $function(
          getDropDownElementWithLabel,
          this.selector.label,
          this.options.selectHiddenElements,
        ),
      'select',
      this.options.selectHiddenElements,
    );
  }

  /**
   * Selects the option corresponding to value passed.
   * @param {any} value value to be selected
   */
  async select(value) {
    const elem = await firstElement.apply(this);
    return await elem.select(value);
  }

  /**
   * Overrides {@link ElementWrapper#elements}, but for {@link DropDown} elements.
   * @param {number} retryInterval Retry Interval in milliseconds (defaults to global settings).
   * @param {number} retryTimeout Retry Timeout in milliseconds (defaults to global settings).
   * @returns {DropDown[]} Array of all elements matching the selector.
   */
  async elements(retryInterval, retryTimeout) {
    let elements = await super.elements(retryInterval, retryTimeout);
    return elements.map((element) => DropDown.from(element, this._description));
  }
}
module.exports = DropDownWrapper;
