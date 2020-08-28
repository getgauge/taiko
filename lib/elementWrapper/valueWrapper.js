const ElementWrapper = require('./elementWrapper');
const { firstElement } = require('./helper');

/**
 * Behaves the same as ElementWrapper, but for elements that hold values of specified types.
 * @extends {ElementWrapper}
 */
class ValueWrapper extends ElementWrapper {
  /**
   * Read the value of the element
   */
  async value() {
    const elem = await firstElement.apply(this);
    return await elem.value();
  }
}

module.exports = ValueWrapper;
