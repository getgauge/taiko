const { match } = require('../elementSearch');
const { handleRelativeSearch } = require('../proximityElementSearch');
const ElementWrapper = require('./elementWrapper');

class TextWrapper extends ElementWrapper {
  constructor(selector, options, description) {
    super(selector, options, description);
    this._get = async () => {
      return await handleRelativeSearch(
        await match(this.selector.label, this.options).elements('*', 0, 0),
        this.selector.args,
      );
    };
  }
}
module.exports = TextWrapper;
