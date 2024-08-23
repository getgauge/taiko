const DropDown = require("../elements/dropDown");
const ValueWrapper = require("./valueWrapper");
const { firstElement, getElementGetter } = require("./helper");
const { $function } = require("../elementSearch");

function getDropDownElementWithLabel(searchElement, label) {
  const fileField = [];
  function checkAndPushElement(elem) {
    if (elem.tagName && elem.tagName.toLowerCase() === "select") {
      fileField.push(elem);
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
  return fileField;
}

/**
 * Behaves the same as ValueWrapper + select().
 * Represents HTML [Select](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select)
 * @extends {ValueWrapper}
 */
class DropDownWrapper extends ValueWrapper {
  constructor(attrValuePairs, _options, ...args) {
    super("DropDown", "label", attrValuePairs, _options, ...args);
    this._get = getElementGetter(
      this.selector,
      async () =>
        await $function(getDropDownElementWithLabel, this.selector.label),
      "select",
    );
  }

  /**
   * Select option or options from a drop down
   * @param {string[]} values value(s) to be selected
   * @example
   *
   * // Select multiple values based on array of values provided
   * await dropDown('Vehicle:').select(['Car','Van'])
   * @example
   * // Select multiple values based on array if indices provided
   * await dropDown('Vehicle:').select({index : [0,1]})
   */
  async select(values) {
    const elem = await firstElement.apply(this);
    return await elem.select(values);
  }

  async options() {
    const elem = await firstElement.apply(this);
    return await elem.options();
  }

  /**
   * Overrides {@link ElementWrapper#elements}, but for DropDown elements.
   * @param {number} retryInterval Retry Interval in milliseconds (defaults to global settings).
   * @param {number} retryTimeout Retry Timeout in milliseconds (defaults to global settings).
   * @returns {DropDown[]} Array of all elements matching the selector.
   */
  async elements(retryInterval, retryTimeout) {
    const elements = await super.elements(retryInterval, retryTimeout);
    return elements.map((element) => DropDown.from(element, this._description));
  }
}
module.exports = DropDownWrapper;
