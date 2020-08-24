const { match } = require('../elementSearch');
const { handleRelativeSearch } = require('../proximityElementSearch');
const ElementWrapper = require('./elementWrapper');

/**
 * Behaves the same as ElementWrapper, but for [HTML text elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element#Text_content).
 * @extends {ElementWrapper}
 */
class TextWrapper extends ElementWrapper {
  constructor(attrValuePairs, _options, ...args) {
    super('Element', 'text', attrValuePairs, _options, ...args);
    this._get = async () => {
      return await handleRelativeSearch(
        await match(this.selector.label, this.options).elements('*', 0, 0),
        this.selector.args,
      );
    };
  }
}
module.exports = TextWrapper;
