const FileField = require('../elements/fileField');
const ValueWrapper = require('./valueWrapper');
class FileFieldWrapper extends ValueWrapper {
  async elements(retryInterval, retryTimeout) {
    let elements = await super.elements(retryInterval, retryTimeout);
    return elements.map(element =>
      FileField.from(element, this._description),
    );
  }
}

module.exports = FileFieldWrapper;
