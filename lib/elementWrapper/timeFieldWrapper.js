const TimeField = require('../elements/timeField');
const ValueWrapper = require('./valueWrapper');
const { firstElement, getElementGetter } = require('./helper');
const { $function } = require('../elementSearch');

function getTimeFieldElementWithLabel(searchElement, label) {
  const timeFields = [];
  const inputTypes = ['date', 'datetime-local', 'month', 'time', 'week'];
  function checkAndPushElement(elem) {
    if (
      elem.tagName &&
      elem.tagName.toLowerCase() == 'input' &&
      elem.type &&
      inputTypes.includes(elem.type.toLowerCase())
    ) {
      timeFields.push(elem);
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
  const inputRadioElements = [
    ...searchElement.querySelectorAll(
      'input[type="date" i],input[type="datetime-local" i],input[type="month" i],input[type="time" i],input[type="week" i]',
    ),
  ];
  for (let inputRadioElement of inputRadioElements) {
    if (
      inputRadioElement.nextSibling.nodeType === Node.TEXT_NODE &&
      inputRadioElement.nextSibling.wholeText.includes(label)
    ) {
      timeFields.push(inputRadioElement);
    }
  }
  return timeFields;
}

/**
 * Behaves the same as ValueWrapper, but for {@link TimeFIeld} element.
 * @extends {ValueWrapper}
 */
class TimeFieldWrapper extends ValueWrapper {
  constructor(attrValuePairs, _options, ...args) {
    super('TimeField', 'label', attrValuePairs, _options, ...args);
    this._get = getElementGetter(
      this.selector,
      async () =>
        await $function(
          getTimeFieldElementWithLabel,
          this.selector.label,
          this.options.selectHiddenElements,
        ),
      'input[type="date" i],input[type="datetime-local" i],input[type="month" i],input[type="time" i],input[type="week" i]',
      this.options.selectHiddenElements,
    );
  }

  /**
   * Select the given date.
   * @param {Date} value
   */
  async select(value) {
    const elem = await firstElement.apply(this);
    return await elem.select(value);
  }

  /**
   * Overrides {@link ValueWrapper#elements}, but for {@link TimeField} elements.
   * @param {number} retryInterval Retry Interval in milliseconds (defaults to global settings).
   * @param {number} retryTimeout Retry Timeout in milliseconds (defaults to global settings).
   * @returns {TimeField[]} Array of all timeFields matching the selector.
   */
  async elements(retryInterval, retryTimeout) {
    let elements = await super.elements(retryInterval, retryTimeout);
    return elements.map((element) => TimeField.from(element, this._description));
  }
}
module.exports = TimeFieldWrapper;
