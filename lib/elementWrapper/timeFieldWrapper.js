const TimeField = require('../elements/timeField');
const ValueWrapper = require('./valueWrapper');
const { firstElement } = require('./helper');
class TimeFieldWrapper extends ValueWrapper {
  async select(value) {
    const elem = await firstElement.apply(this);
    return await elem.select(value);
  }

  async elements(retryInterval, retryTimeout) {
    let elements = await super.elements(retryInterval, retryTimeout);
    return elements.map((element) => TimeField.from(element, this._description));
  }
}
module.exports = TimeFieldWrapper;
