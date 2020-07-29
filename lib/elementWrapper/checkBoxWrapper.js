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
      inputRadioElement.nextSibling.nodeType === Node.TEXT_NODE &&
      inputRadioElement.nextSibling.wholeText.includes(label)
    ) {
      checkBoxes.push(inputRadioElement);
    }
  }
  return checkBoxes;
}
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

  async isChecked() {
    const elem = await firstElement.apply(this);
    return await elem.isChecked();
  }
  async check() {
    const elem = await firstElement.apply(this);
    await elem.check();
  }
  async uncheck() {
    const elem = await firstElement.apply(this);
    await elem.uncheck();
  }
  async elements(retryInterval, retryTimeout) {
    let elements = await super.elements(retryInterval, retryTimeout);
    return elements.map((element) => CheckBox.from(element, this._description));
  }
}
module.exports = CheckBoxWrapper;
