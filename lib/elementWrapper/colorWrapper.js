const Color = require('../elements/color');
const ValueWrapper = require('./valueWrapper');
const { $function } = require('../elementSearch');
const { firstElement, getElementGetter } = require('./helper');

function getColorElementWithLabel(label) {
  const fileField = [];
  function checkAndPushElement(elem) {
    if (
      elem.tagName &&
      elem.tagName.toLowerCase() == 'input' &&
      elem.type &&
      elem.type.toLowerCase() === 'color'
    ) {
      fileField.push(elem);
    }
  }
  const matchingLabels = [...document.querySelectorAll('label')].filter((labelElem) => {
    return labelElem.innerText.toLowerCase().includes(label.toLowerCase());
  });
  for (let matchingLabel of matchingLabels) {
    const labelFor = matchingLabel.getAttribute('for');
    if (labelFor) {
      //check label with attribute for
      const labelForElement = document.getElementById(labelFor);
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
class ColorWrapper extends ValueWrapper {
  constructor(selector, options, description) {
    super(selector, options, description);
    this._get = getElementGetter(
      this.selector,
      async () =>
        await $function(
          getColorElementWithLabel,
          this.selector.label,
          this.options.selectHiddenElements,
        ),
      'input[type="color"]',
      this.options.selectHiddenElements,
    );
  }

  async select(value) {
    const elem = await firstElement.apply(this);
    return await elem.select(value);
  }
  async elements(retryInterval, retryTimeout) {
    let elements = await super.elements(retryInterval, retryTimeout);
    return elements.map((element) => Color.from(element, this._description));
  }
}
module.exports = ColorWrapper;
