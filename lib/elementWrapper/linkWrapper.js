const { match } = require('../elementSearch');
const { getElementGetter } = require('./helper');
const ElementWrapper = require('./elementWrapper');

class LinkWrapper extends ElementWrapper {
  constructor(selector, options, description) {
    super(selector, options, description);
    this._get = getElementGetter(
      this.selector,
      async () => await match(this.selector.label, this.options).elements('a', 0, 0),
      'a',
      this.options.selectHiddenElements,
    );
  }
}
module.exports = LinkWrapper;
