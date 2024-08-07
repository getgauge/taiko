const Color = require("../elements/color");
const ValueWrapper = require("./valueWrapper");
const { $function } = require("../elementSearch");
const { firstElement, getElementGetter } = require("./helper");

function getColorElementWithLabel(searchElement, label) {
  const fileField = [];
  function checkAndPushElement(elem) {
    if (
      elem.tagName &&
      elem.tagName.toLowerCase() === "input" &&
      elem.type &&
      elem.type.toLowerCase() === "color"
    ) {
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
 * Represents HTML [Input Color](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color)
 * @extends {ValueWrapper}
 */
class ColorWrapper extends ValueWrapper {
  constructor(attrValuePairs, _options, ...args) {
    super("Color", "label", attrValuePairs, _options, ...args);
    this._get = getElementGetter(
      this.selector,
      async () =>
        await $function(getColorElementWithLabel, this.selector.label),
      'input[type="color"]',
    );
  }

  async select(value) {
    const elem = await firstElement.apply(this);
    return await elem.select(value);
  }

  /**
   * Overrides {@link ElementWrapper#elements}, but for Color elements.
   * @param {number} retryInterval Retry Interval in milliseconds (defaults to global settings).
   * @param {number} retryTimeout Retry Timeout in milliseconds (defaults to global settings).
   * @returns {Color[]} Array of all elements matching the selector.
   */
  async elements(retryInterval, retryTimeout) {
    const elements = await super.elements(retryInterval, retryTimeout);
    return elements.map((element) => Color.from(element, this._description));
  }
}
module.exports = ColorWrapper;
