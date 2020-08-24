const { match } = require('../elementSearch');
const { getElementGetter } = require('./helper');
const ElementWrapper = require('./elementWrapper');

/**
 * Behaves the same as ElementWrapper, but represents [`li`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li) HTML tag.
 * @extends {ElementWrapper}
 */
class ListItemWrapper extends ElementWrapper {
  constructor(attrValuePairs, _options, ...args) {
    super('ListItem', 'label', attrValuePairs, _options, ...args);
    this._get = getElementGetter(
      this.selector,
      async () => await match(this.selector.label, this.options).elements('li', 0, 0),
      'li',
      this.options.selectHiddenElements,
    );
  }
}
module.exports = ListItemWrapper;
