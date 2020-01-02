const TextBox = require('../elements/textBox');
const ValueWrapper = require('./valueWrapper');
class TextBoxWrapper extends ValueWrapper {
  async elements(retryInterval, retryTimeout) {
    let elements = await super.elements(retryInterval, retryTimeout);
    return elements.map(element =>
      TextBox.from(element, this._description),
    );
  }
}

module.exports = TextBoxWrapper;
