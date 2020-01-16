const CheckBox = require('../elements/checkBox');
const ElementWrapper = require('./elementWrapper');
const { firstElement } = require('./helper');
class CheckBoxWrapper extends ElementWrapper {
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
    return elements.map(element => CheckBox.from(element, this._description));
  }
}
module.exports = CheckBoxWrapper;
