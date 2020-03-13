const Color = require('../elements/color');
const ElementWrapper = require('./elementWrapper');
const { firstElement } = require('./helper');
class ColorWrapper extends ElementWrapper {
  async select(value) {
    const elem = await firstElement.apply(this);
    return await elem.select(value);
  }
  async value() {
    const elem = await firstElement.apply(this);
    return await elem.value();
  }
  async elements(retryInterval, retryTimeout) {
    let elements = await super.elements(retryInterval, retryTimeout);
    return elements.map(element => Color.from(element, this._description));
  }
}
module.exports = ColorWrapper;
