const RadioButton = require('../elements/radioButton');
const ElementWrapper = require('./elementWrapper');
class RadioButtonWrapper extends ElementWrapper {
  async isSelected() {
    const elems = await this.elements();
    if (!elems || elems.length < 1) {
      throw new Error(`${this.description} is not found`);
    }
    return await elems[0].isSelected();
  }
  async select() {
    const elems = await this.elements();
    if (!elems || elems.length < 1) {
      throw new Error(`${this.description} is not found`);
    }
    await elems[0].select();
  }
  async deselect() {
    const elems = await this.elements();
    if (!elems || elems.length < 1) {
      throw new Error(`${this.description} is not found`);
    }
    await elems[0].deselect();
  }
  async elements(retryInterval, retryTimeout) {
    let elements = await super.elements(retryInterval, retryTimeout);
    return elements.map(element =>
      RadioButton.from(element, this._description),
    );
  }
}
module.exports = RadioButtonWrapper;
