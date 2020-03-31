const Element = require('./element');

class TimeField extends Element {
  async value() {
    function getValue() {
      return this.value;
    }
    const options = { nodeId: this.get() };
    const { result } = await this.runtimeHandler.runtimeCallFunctionOn(getValue, null, options);
    return result.value;
  }
  static from(element, description) {
    return new TimeField(element.get(), description, element.runtimeHandler);
  }
}

module.exports = TimeField;
