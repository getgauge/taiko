const { firstElement } = require('./helper');

const { descEvent } = require('../eventBus');
let _getIfExists;
class ElementWrapper {
  constructor(get, description, getIfExists) {
    this._get = get;
    this._description = description;
    _getIfExists = getIfExists;
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
        descEvent.emit('success', 'Does not exists');
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
  async elements(retryInterval, retryTimeout) {
    return await _getIfExists(this._get, this._description)(null, retryInterval, retryTimeout);
  }

  async element(index, retryInterval, retryTimeout) {
    const results = await _getIfExists(this._get, this._description)(
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
