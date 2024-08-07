const CheckBox = require("../elements/checkBox");
const { $function } = require("../elementSearch");
const ElementWrapper = require("./elementWrapper");
const { firstElement, getElementGetter } = require("./helper");

function getCheckBoxElementWithLabel(searchElement, label) {
  const checkBoxes = [];
  function checkAndPushElement(elem) {
    if (
      elem.tagName &&
      elem.tagName.toLowerCase() === "input" &&
      elem.type &&
      elem.type.toLowerCase() === "checkbox"
    ) {
      checkBoxes.push(elem);
    }
  }
  const matchingLabels = [...searchElement.querySelectorAll("label")].filter(
    (labelElem) => {
      return labelElem.innerText.toLowerCase().includes(label.toLowerCase());
    },
  );
  for (const matchingLabel of matchingLabels) {
    const labelFor = matchingLabel.getAttribute("for");
    if (labelFor) {
      //check label with attribute for
      const labelForElement = searchElement.getElementById(labelFor);
      checkAndPushElement(labelForElement);
    } else {
      // check child node of label tag
      for (const elem of matchingLabel.childNodes) {
        checkAndPushElement(elem);
      }
    }
  }
  //check label is inlined
  const inputRadioElements = [
    ...searchElement.querySelectorAll('input[type="checkbox" i]'),
  ];
  for (const inputRadioElement of inputRadioElements) {
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
 * Behaves the same as ElementWrapper + isChecked()/check()/uncheck().
 * Represents HTML [Input Checkbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox)
 * @extends {ElementWrapper}
 */
class CheckBoxWrapper extends ElementWrapper {
  constructor(attrValuePairs, _options, ...args) {
    super("CheckBox", "label", attrValuePairs, _options, ...args);
    this._get = getElementGetter(
      this.selector,
      async () =>
        await $function(getCheckBoxElementWithLabel, this.selector.label),
      'input[type="checkbox" i]',
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
   * Overrides {@link ElementWrapper#elements}, but for Checkbox elements.
   * @param {number} retryInterval Retry Interval in milliseconds (defaults to global settings).
   * @param {number} retryTimeout Retry Timeout in milliseconds (defaults to global settings).
   * @returns {CheckBox[]} Array of all checkboxes matching the selector.
   */
  async elements(retryInterval, retryTimeout) {
    const elements = await super.elements(retryInterval, retryTimeout);
    return elements.map((element) => CheckBox.from(element, this._description));
  }
}
module.exports = CheckBoxWrapper;
