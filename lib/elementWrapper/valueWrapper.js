const ElementWrapper = require('./elementWrapper');
const { firstElement } = require('./helper');
class ValueWrapper extends ElementWrapper {
  async value() {
    const elem = await firstElement.apply(this);
    return await elem.value();
  }
}

module.exports = ValueWrapper;
