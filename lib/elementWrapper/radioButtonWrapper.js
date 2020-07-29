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
      inputRadioElement.nextSibling.nodeType === Node.TEXT_NODE &&
      inputRadioElement.nextSibling.wholeText.includes(label)
    ) {
      radioButton.push(inputRadioElement);
    }
  }
  return radioButton;
}
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

  async isSelected() {
    const elem = await firstElement.apply(this);
    return await elem.isSelected();
  }
  async select() {
    const elem = await firstElement.apply(this);
    await elem.select();
  }
  async deselect() {
    const elem = await firstElement.apply(this);
    await elem.deselect();
  }
  async elements(retryInterval, retryTimeout) {
    let elements = await super.elements(retryInterval, retryTimeout);
    return elements.map((element) => RadioButton.from(element, this._description));
  }
}
module.exports = RadioButtonWrapper;
