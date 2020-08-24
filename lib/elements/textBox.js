const Element = require('./element');

/**
 * Represents HTML Text Input. Supported types:
 * - [`input[type="text" i]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/text)
 * - [`input[type="password" i]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/password)
 * - [`input[type="search" i]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/search)
 * - [`input[type="number" i]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number)
 * - [`input[type="email" i]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email)
 * - [`input[type="tel" i]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/tel)
 * - [`input[type="url" i]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/url)
 * - [`input:not([type])`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input) with no `type` attribute.
 * - [`textarea`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea)
 * - [`*[contenteditable="true"]`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/contentEditable)
 * @extends {Element}
 * @see {TextBoxWrapper} for methods available
 */
class TextBox extends Element {
  async value() {
    function getvalue() {
      if (this.value) {
        return this.value;
      }
      return this.innerText;
    }
    const { result } = await this.runtimeHandler.runtimeCallFunctionOn(getvalue, null, {
      objectId: this.get(),
    });
    return result.value;
  }
  static from(element, description) {
    return new TextBox(element.get(), description, element.runtimeHandler);
  }
}

module.exports = TextBox;
