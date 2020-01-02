let _getIfExists;
class ElementWrapper {
  constructor(get, description, descEvent, getIfExists) {
    this._get = get;
    this._description = description;
    this._descEvent = descEvent;
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
    const elems = await this.elements(retryInterval, retryTimeout);
    if (elems.length < 1) {
      this._descEvent.emit('success', 'Does not exists');
      return false;
    }
    this._descEvent.emit('success', 'Exists');
    return true;
  }

  async text() {
    const elems = await this.elements();
    if (!elems[0]) {
      throw new Error(`${this.description} not found`);
    }
    return await elems[0].text();
  }

  async elements(retryInterval, retryTimeout) {
    return await _getIfExists(this._get, this._description)(
      null,
      retryInterval,
      retryTimeout,
    );
  }
}

module.exports = ElementWrapper;
