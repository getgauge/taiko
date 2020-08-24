const { $$xpath, $$ } = require('../elementSearch');
const { handleRelativeSearch } = require('../proximityElementSearch');
const ElementWrapper = require('./elementWrapper');

/**
 * Wrapper object of all found elements. This list mimics the behaviour of {@link Element}
 * by exposing similar methods. The call of these methods gets delegated to first element.
 * By default, the `ElementWrapper` acts as a proxy to the first matching element and hence
 * it forwards function calls that belong to {@link Element}
 *
 * {@link DollarWrapper} is identical to {@link ElementWrapper} except that it represents
 * the results of '{@link $} selector.
 * @extends {ElementWrapper}
 */

class DollarWrapper extends ElementWrapper {
  constructor(attrValuePairs, _options, ...args) {
    super('CustomSelector', 'query', attrValuePairs, _options, ...args);
    this._get = async () => {
      return await handleRelativeSearch(
        await (this.selector.label.startsWith('//') || this.selector.label.startsWith('(')
          ? $$xpath(this.selector.label, this.options.selectHiddenElements)
          : $$(this.selector.label, this.options.selectHiddenElements)),
        this.selector.args,
      );
    };
  }
}
module.exports = DollarWrapper;
