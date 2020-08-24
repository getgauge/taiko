const { match } = require('../elementSearch');
const { getElementGetter } = require('./helper');
const ElementWrapper = require('./elementWrapper');

/**
 * Behaves the same as ElementWrapper, but represents [`a`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a) HTML tag.
 * @extends {ElementWrapper}
 */
class LinkWrapper extends ElementWrapper {
  constructor(attrValuePairs, _options, ...args) {
    super('Link', 'text', attrValuePairs, _options, ...args);
    this._get = getElementGetter(
      this.selector,
      async () => await match(this.selector.label, this.options).elements('a', 0, 0),
      'a',
      this.options.selectHiddenElements,
    );
  }
}
module.exports = LinkWrapper;
