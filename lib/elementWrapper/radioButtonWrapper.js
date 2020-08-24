const RadioButton = require('../elements/radioButton');
const ElementWrapper = require('./elementWrapper');
const { firstElement, getElementGetter } = require('./helper');
const { $function } = require('../elementSearch');

function getRadioButtonElementWithLabel(searchElement, label) {
  const radioButton = [];
  function checkAndPushElement(elem) {
    if (
      elem.tagName &&
      elem.tagName.toLowerCase() == 'input' &&
      elem.type &&
      elem.type.toLowerCase() === 'radio'
    ) {
      radioButton.push(elem);
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
  const inputRadioElements = [...searchElement.querySelectorAll('input[type="radio" i]')];
  for (let inputRadioElement of inputRadioElements) {
    if (
      inputRadioElement.nextSibling &&
      inputRadioElement.nextSibling.nodeType === Node.TEXT_NODE &&
      inputRadioElement.nextSibling.wholeText.includes(label)
    ) {
      radioButton.push(inputRadioElement);
    }
  }
  return radioButton;
}

/**
 * Behaves the same as ElementWrapper, but for {@link RadioButton} element.
 * @extends {ElementWrapper}
 */
class RadioButtonWrapper extends ElementWrapper {
  constructor(attrValuePairs, _options, ...args) {
    super('RadioButton', 'label', attrValuePairs, _options, ...args);
    this._get = getElementGetter(
      this.selector,
      async () =>
        await $function(
          getRadioButtonElementWithLabel,
          this.selector.label,
          this.options.selectHiddenElements,
        ),
      'input[type="radio" i]',
      this.options.selectHiddenElements,
    );
  }

  /**
   * Check if radioButton is selected.
   * @example
   * await radioButton('Vehicle').isSelected()
   * @returns {boolean} true if selected, else false
   */
  async isSelected() {
    const elem = await firstElement.apply(this);
    return await elem.isSelected();
  }

  /**
   * Select the radioButton.
   * @example
   * await radioButton('Vehicle').select()
   */
  async select() {
    const elem = await firstElement.apply(this);
    await elem.select();
  }

  /**
   * Reset the radioButton.
   * @example
   * await radioButton('Vehicle').deselect()
   */
  async deselect() {
    const elem = await firstElement.apply(this);
    await elem.deselect();
  }

  /**
   * Overrides {@link ElementWrapper#elements}, but for {@link RadioButton} elements.
   * @param {number} retryInterval Retry Interval in milliseconds (defaults to global settings).
   * @param {number} retryTimeout Retry Timeout in milliseconds (defaults to global settings).
   * @returns {RadioButton[]} Array of all radioButtons matching the selector.
   */
  async elements(retryInterval, retryTimeout) {
    let elements = await super.elements(retryInterval, retryTimeout);
    return elements.map((element) => RadioButton.from(element, this._description));
  }
}
module.exports = RadioButtonWrapper;
