const TimeField = require('../elements/timeField');
const ElementWrapper = require('./elementWrapper');
const { firstElement } = require('./helper');
class TimeFieldWrapper extends ElementWrapper {
  async value() {
    const elem = await firstElement.apply(this);
    return await elem.value();
  }
  async elements(retryInterval, retryTimeout) {
    let elements = await super.elements(retryInterval, retryTimeout);
    return elements.map((element) => TimeField.from(element, this._description));
  }
}
module.exports = TimeFieldWrapper;
