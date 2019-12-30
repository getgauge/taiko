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
  elements(retryInterval, retryTimeout) {
    return _getIfExists(this._get, this._description)(
      null,
      retryInterval,
      retryTimeout,
    );
  }
}

class ValueWrapper extends ElementWrapper {
  async value() {
    const elems = await this.elements();
    if (!elems || elems.length < 1) {
      throw new Error(`${this.description} is not found`);
    }
    return await elems[0].value();
  }
}
class FileFieldWrapper extends ValueWrapper {
  async elements(retryInterval, retryTimeout) {
    let elements = await super.elements(retryInterval, retryTimeout);
    return elements.map(element =>
      Object.assign(element, { value: value }),
    );
  }
}

class TextBoxWrapper extends ValueWrapper {
  async elements(retryInterval, retryTimeout) {
    let elements = await super.elements(retryInterval, retryTimeout);
    return elements.map(element =>
      Object.assign(element, { value: textBoxValue }),
    );
  }
}

const value = async function() {
  function getvalue() {
    return this.value;
  }
  const {
    result,
  } = await this.runtimeHandler.runtimeCallFunctionOn(
    getvalue,
    null,
    { nodeId: this.get() },
  );
  return result.value;
};

const textBoxValue = async function() {
  function getvalue() {
    if (this.value) {
      return this.value;
    }
    return this.innerText;
  }
  const {
    result,
  } = await this.runtimeHandler.runtimeCallFunctionOn(
    getvalue,
    null,
    { nodeId: this.get() },
  );
  return result.value;
};

module.exports = {
  ElementWrapper,
  FileFieldWrapper,
  TextBoxWrapper,
};
