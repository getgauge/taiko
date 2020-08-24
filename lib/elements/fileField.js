const Element = require('./element');

/**
 * Represents HTML [Input File Field](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file)
 * @extends {Element}
 * @see {FileFieldWrapper} for methods available
 */
class FileField extends Element {
  async value() {
    function getvalue() {
      return this.value;
    }
    const options = { objectId: this.get() };
    const { result } = await this.runtimeHandler.runtimeCallFunctionOn(getvalue, null, options);
    return result.value;
  }
  static from(element, description) {
    return new FileField(element.get(), description, element.runtimeHandler);
  }
}
module.exports = FileField;
