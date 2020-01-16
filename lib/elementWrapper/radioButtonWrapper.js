const RadioButton = require('../elements/radioButton');
const ElementWrapper = require('./elementWrapper');
const { firstElement } = require('./helper');
class RadioButtonWrapper extends ElementWrapper {
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
    return elements.map(element => RadioButton.from(element, this._description));
  }
}
module.exports = RadioButtonWrapper;
