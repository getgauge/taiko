const DropDown = require('../elements/dropDown');
const ElementWrapper = require('./elementWrapper');
class DropDownWrapper extends ElementWrapper {
  async select(value) {
    const elems = await this.elements();
    if (!elems || elems.length < 1) {
      throw new Error(`${this.description} is not found`);
    }
    return await elems[0].select(value);
  }
  async value() {
    const elems = await this.elements();
    if (!elems || elems.length < 1) {
      throw new Error(`${this.description} is not found`);
    }
    return await elems[0].value();
  }
  async elements(retryInterval, retryTimeout) {
    let elements = await super.elements(retryInterval, retryTimeout);
    return elements.map(element =>
      DropDown.from(element, this._description),
    );
  }
}
module.exports = DropDownWrapper;
