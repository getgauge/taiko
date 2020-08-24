const CheckBox = require('../elements/checkBox');
const { $function } = require('../elementSearch');
const ElementWrapper = require('./elementWrapper');
const { firstElement, getElementGetter } = require('./helper');

function getCheckBoxElementWithLabel(searchElement, label) {
  const checkBoxes = [];
  function checkAndPushElement(elem) {
    if (
      elem.tagName &&
      elem.tagName.toLowerCase() == 'input' &&
      elem.type &&
      elem.type.toLowerCase() === 'checkbox'
    ) {
      checkBoxes.push(elem);
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
  //check label is inlined
  const inputRadioElements = [...searchElement.querySelectorAll('input[type="checkbox" i]')];
  for (let inputRadioElement of inputRadioElements) {
    if (
      inputRadioElement.nextSibling &&
      inputRadioElement.nextSibling.nodeType === Node.TEXT_NODE &&
      inputRadioElement.nextSibling.wholeText.includes(label)
    ) {
      checkBoxes.push(inputRadioElement);
    }
  }
  return checkBoxes;
}

/**
 * Behaves the same as ElementWrapper, but for {@link CheckBox} element.
 * @extends {ElementWrapper}
 */
class CheckBoxWrapper extends ElementWrapper {
  constructor(attrValuePairs, _options, ...args) {
    super('CheckBox', 'label', attrValuePairs, _options, ...args);
    this._get = getElementGetter(
      this.selector,
      async () =>
        await $function(
          getCheckBoxElementWithLabel,
          this.selector.label,
          this.options.selectHiddenElements,
        ),
      'input[type="checkbox" i]',
      this.options.selectHiddenElements,
    );
  }

  /**
   * Get state of selected checkbox.
   * @example
   * await checkBox('Vehicle').isChecked()
   * @returns {boolean} true if checked, else false
   */
  async isChecked() {
    const elem = await firstElement.apply(this);
    return await elem.isChecked();
  }

  /**
   * Set checkbox to 'checked' state.
   * @example
   * await checkBox('Vehicle').check()
   */
  async check() {
    const elem = await firstElement.apply(this);
    await elem.check();
  }

  /**
   * Clears checkbox's state, if set.
   * @example
   * await checkBox('Vehicle').uncheck()
   */
  async uncheck() {
    const elem = await firstElement.apply(this);
    await elem.uncheck();
  }

  /**
   * Overrides {@link ElementWrapper#elements}, but for {@link Checkbox} elements.
   * @param {number} retryInterval Retry Interval in milliseconds (defaults to global settings).
   * @param {number} retryTimeout Retry Timeout in milliseconds (defaults to global settings).
   * @returns {CheckBox[]} Array of all checkboxes matching the selector.
   */
  async elements(retryInterval, retryTimeout) {
    let elements = await super.elements(retryInterval, retryTimeout);
    return elements.map((element) => CheckBox.from(element, this._description));
  }
}
module.exports = CheckBoxWrapper;
