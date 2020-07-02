const { $$xpath, $$ } = require('../elementSearch');
const { handleRelativeSearch } = require('../proximityElementSearch');
const ElementWrapper = require('./elementWrapper');

class DollarWrapper extends ElementWrapper {
  constructor(selector, options, description) {
    super(selector, options, description);
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
