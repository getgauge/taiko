const TimeField = require('../elements/timeField');
const ValueWrapper = require('./valueWrapper');
class TimeFieldWrapper extends ValueWrapper {
  async elements(retryInterval, retryTimeout) {
    let elements = await super.elements(retryInterval, retryTimeout);
    return elements.map((element) => TimeField.from(element, this._description));
  }
}
module.exports = TimeFieldWrapper;
