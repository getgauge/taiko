const { firstElement, desc, prepareParameters } = require('./helper');

const { descEvent } = require('../eventBus');
let { getIfExists } = require('../elementSearch');
class ElementWrapper {
  constructor(elementType, query, attrValuePairs, _options, ...args) {
    const { selector, options } = prepareParameters(attrValuePairs, _options, ...args);
    this.selector = selector;
    this.options = options;
    this._description = desc(selector, query, elementType, options);
  }

  async get(retryInterval, retryTimeout) {
    console.warn('DEPRECATED use .elements()');
    return this.elements(retryInterval, retryTimeout);
  }

  get description() {
    return this._description;
  }

  async exists(retryInterval, retryTimeout) {
    try {
      await firstElement.apply(this, [retryInterval, retryTimeout]);
    } catch (e) {
      if (e.message === `${this._description} not found`) {
        descEvent.emit('success', 'Does not exist');
        return false;
      }
      throw e;
    }
    descEvent.emit('success', 'Exists');
    return true;
  }

  async text() {
    const elem = await firstElement.apply(this);
    return await elem.text();
  }

  async isVisible(retryInterval, retryTimeout) {
    const elem = await firstElement.apply(this, [retryInterval, retryTimeout]);
    if (await elem.isVisible()) {
      descEvent.emit('success', 'Element is Visible');
      return true;
    }
    return false;
  }
  async isDisabled(retryInterval, retryTimeout) {
    const elem = await firstElement.apply(this, [retryInterval, retryTimeout]);
    return await elem.isDisabled();
  }
  async isDraggable(retryInterval, retryTimeout) {
    const elem = await firstElement.apply(this, [retryInterval, retryTimeout]);
    return await elem.isDraggable();
  }
  async elements(retryInterval, retryTimeout) {
    return await getIfExists(this._get, this._description)(null, retryInterval, retryTimeout);
  }

  async element(index, retryInterval, retryTimeout) {
    const results = await getIfExists(this._get, this._description)(
      null,
      retryInterval,
      retryTimeout,
    );
    if (index > results.length - 1) {
      throw new Error(`Element index is out of range. There are only ${results.length} element(s)`);
    }
    return results[index];
  }
}

module.exports = ElementWrapper;
