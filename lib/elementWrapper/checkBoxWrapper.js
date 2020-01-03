const CheckBox = require('../elements/checkBox');
const ElementWrapper = require('./elementWrapper');
class CheckBoxWrapper extends ElementWrapper {
  async isChecked() {
    const elems = await this.elements();
    if (!elems || elems.length < 1) {
      throw new Error(`${this.description} is not found`);
    }
    return await elems[0].isChecked();
  }
  async check() {
    const elems = await this.elements();
    if (!elems || elems.length < 1) {
      throw new Error(`${this.description} is not found`);
    }
    await elems[0].check();
  }
  async uncheck() {
    const elems = await this.elements();
    if (!elems || elems.length < 1) {
      throw new Error(`${this.description} is not found`);
    }
    await elems[0].uncheck();
  }
  async elements(retryInterval, retryTimeout) {
    let elements = await super.elements(retryInterval, retryTimeout);
    return elements.map(element =>
      CheckBox.from(element, this._description),
    );
  }
}
module.exports = CheckBoxWrapper;
