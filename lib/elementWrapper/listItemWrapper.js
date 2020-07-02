const { match } = require('../elementSearch');
const { getElementGetter } = require('./helper');
const ElementWrapper = require('./elementWrapper');

class ListItemWrapper extends ElementWrapper {
  _get = getElementGetter(
    this.selector,
    async () => await match(this.selector.label, this.options).elements('li', 0, 0),
    'li',
    this.options.selectHiddenElements,
  );
}
module.exports = ListItemWrapper;