const ElementWrapper = require('./elementWrapper');
const { firstElement } = require('./helper');

/**
 * Behaves the same as ElementWrapper, but for elements that hold multiple values of
 * specified types (such as a dropdown which supports multiple selections).
 * @extends {ElementWrapper}
 */
class MultiValueWrapper extends ElementWrapper {
  /**
   * Read the value of the element
   *
   * @returns {Promise<string | string[] | number[]>}
   * @memberof MultiValueWrapper
   */
  async values() {
    const elem = await firstElement.apply(this);
    return await elem.values();
  }
}

module.exports = MultiValueWrapper;
