const DropDown = require('../elements/dropDown');
const ValueWrapper = require('./valueWrapper');
const { firstElement, getElementGetter } = require('./helper');
const { $function } = require('../elementSearch');

function getDropDownElementWithLabel(label) {
  const fileField = [];
  function checkAndPushElement(elem) {
    if (elem.tagName && elem.tagName.toLowerCase() == 'select') {
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
class DropDownWrapper extends ValueWrapper {
  _get = getElementGetter(
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

  async select(value) {
    const elem = await firstElement.apply(this);
    return await elem.select(value);
  }

  async elements(retryInterval, retryTimeout) {
    let elements = await super.elements(retryInterval, retryTimeout);
    return elements.map((element) => DropDown.from(element, this._description));
  }
}
module.exports = DropDownWrapper;
