const { $$ } = require("../elementSearch");
const { getElementGetter } = require("./helper");
const ElementWrapper = require("./elementWrapper");

/**
 * Behaves the same as ElementWrapper.
 * Represents HTML [`img`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img) tag.
 * @extends {ElementWrapper}
 */
class ImageWrapper extends ElementWrapper {
  constructor(attrValuePairs, _options, ...args) {
    super("Image", "alt", attrValuePairs, _options, ...args);
    this._get = getElementGetter(
      this.selector,
      async () => await $$(`img[alt*="${this.selector.label}"]`),
      'img,[style*="background-image"]',
    );
  }
}
module.exports = ImageWrapper;
