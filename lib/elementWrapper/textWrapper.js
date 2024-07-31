const { match } = require("../elementSearch");
const { handleRelativeSearch } = require("../proximityElementSearch");
const ElementWrapper = require("./elementWrapper");

/**
 * Behaves the same as ElementWrapper, but for [HTML text elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element#Text_content).
 * Supported HTML tags:
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
 * @extends {ElementWrapper}
 */
class TextWrapper extends ElementWrapper {
  constructor(attrValuePairs, _options, ...args) {
    super("Element", "text", attrValuePairs, _options, ...args);
    this._get = async () => {
      return await handleRelativeSearch(
        await match(this.selector.label, this._options).elements("*", 0, 0),
        this.selector.args,
      );
    };
  }
}
module.exports = TextWrapper;
