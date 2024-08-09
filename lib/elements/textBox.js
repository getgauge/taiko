const Element = require("./element");

class TextBox extends Element {
  async value() {
    function getvalue() {
      if (this.value) {
        return this.value;
      }
      return this.innerText;
    }
    const { result } = await this.runtimeHandler.runtimeCallFunctionOn(
      getvalue,
      null,
      {
        objectId: this.get(),
      },
    );
    return result.value;
  }
  static from(element, description) {
    return new TextBox(element.get(), description, element.runtimeHandler);
  }
}

module.exports = TextBox;
