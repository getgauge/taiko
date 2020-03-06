class Element {
  constructor(nodeId, description, runtimeHandler) {
    this.nodeId = nodeId;
    this.description = description;
    this.runtimeHandler = runtimeHandler;
  }
  get() {
    return this.nodeId;
  }

  async text() {
    let getText = function() {
      if (this.nodeType === Node.TEXT_NODE) {
        return this.parentElement.innerText;
      } else {
        return this.innerText;
      }
    };
    const result = await this.runtimeHandler.runtimeCallFunctionOn(getText, null, {
      nodeId: this.nodeId,
    });
    return result.result.value;
  }

  async isVisible() {
    function isHidden() {
      let elem = this;
      if (this.nodeType === Node.TEXT_NODE) {
        elem = this.parentElement;
      }
      return !(elem.offsetHeight || elem.offsetWidth || elem.getClientRects().length);
    }
    const result = await this.runtimeHandler.runtimeCallFunctionOn(isHidden, null, {
      nodeId: this.nodeId,
      returnByValue: true,
    });
    return !result.result.value;
  }

  static create(nodeIds, runtimeHandler) {
    return nodeIds.map(nodeId => new Element(nodeId, '', runtimeHandler));
  }

  async isDisabled() {
    function isDisabled() {
      if (this.nodeType === Node.ELEMENT_NODE) {
        return this.parentElement.disabled || this.disabled;
      }
    }
    const { result } = await this.runtimeHandler.runtimeCallFunctionOn(isDisabled, null, {
      nodeId: this.nodeId,
      returnByValue: true,
    });
    if (result.value === undefined) {
      throw new Error(`${this.description} does not have disable attribute`);
    }
    return result.value;
  }
}

module.exports = Element;
