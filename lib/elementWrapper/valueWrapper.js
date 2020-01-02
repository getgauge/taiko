const ElementWrapper = require('./elementWrapper');
class ValueWrapper extends ElementWrapper {
  async value() {
    const elems = await this.elements();
    if (!elems || elems.length < 1) {
      throw new Error(`${this.description} is not found`);
    }
    return await elems[0].value();
  }
}

module.exports = ValueWrapper;
