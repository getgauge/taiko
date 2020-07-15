const { $$ } = require('../elementSearch');
const { getElementGetter } = require('./helper');
const ElementWrapper = require('./elementWrapper');

class ImageWrapper extends ElementWrapper {
  constructor(attrValuePairs, _options, ...args) {
    super('Image', 'alt', attrValuePairs, _options, ...args);
    this._get = getElementGetter(
      this.selector,
      async () => await $$(`img[alt*="${this.selector.label}"]`, this.options.selectHiddenElements),
      'img,[style*="background-image"]',
      this.options.selectHiddenElements,
    );
  }
}
module.exports = ImageWrapper;
