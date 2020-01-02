const { Element } = require('./element');
class FileField extends Element {
  async value() {
    function getvalue() {
      return this.value;
    }
    const {
      result,
    } = await this.runtimeHandler.runtimeCallFunctionOn(
      getvalue,
      null,
      { nodeId: this.get() },
    );
    return result.value;
  }
  static from(element, description) {
    return new FileField(
      element.get(),
      description,
      element.runtimeHandler,
    );
  }
}
module.exports = FileField;
