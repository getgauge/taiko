const FileField = require("../elements/fileField");
const ValueWrapper = require("./valueWrapper");
const { $function } = require("../elementSearch");
const { getElementGetter } = require("./helper");

function getFileFieldElementWithLabel(searchElement, label) {
  const fileField = [];
  function checkAndPushElement(elem) {
    if (
      elem.tagName &&
      elem.tagName.toLowerCase() == "input" &&
      elem.type &&
      elem.type.toLowerCase() === "file"
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
      matchingLabel.childNodes.forEach((elem) => {
        checkAndPushElement(elem);
      });
    }
  }
  return fileField;
}

/**
 * Behaves the same as ValueWrapper, but for FileField element.
 * Represents HTML [Input File Field](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file)
 * @extends {ValueWrapper}
 */
class FileFieldWrapper extends ValueWrapper {
  constructor(attrValuePairs, _options, ...args) {
    super("FileField", "label", attrValuePairs, _options, ...args);
    this._get = getElementGetter(
      this.selector,
      async () =>
        await $function(getFileFieldElementWithLabel, this.selector.label),
      'input[type="file"]',
    );
  }

  /**
   * Overrides {@link ElementWrapper#elements}, but for FileField elements.
   * @param {number} retryInterval Retry Interval in milliseconds (defaults to global settings).
   * @param {number} retryTimeout Retry Timeout in milliseconds (defaults to global settings).
   * @returns {FileField[]} Array of all elements matching the selector.
   */
  async elements(retryInterval, retryTimeout) {
    const elements = await super.elements(retryInterval, retryTimeout);
    return elements.map((element) =>
      FileField.from(element, this._description),
    );
  }
}

module.exports = FileFieldWrapper;
