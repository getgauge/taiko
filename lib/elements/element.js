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
      return this.innerText;
    };
    const result = await this.runtimeHandler.runtimeCallFunctionOn(
      getText,
      null,
      { nodeId: this.nodeId },
    );
    return result.result.value;
  }

  async isVisible() {
    function isHidden() {
      let elem = this;
      if (this.nodeType === Node.TEXT_NODE) {
        elem = this.parentElement;
      }
      return !(
        elem.offsetHeight ||
        elem.offsetWidth ||
        elem.getClientRects().length
      );
    }
    const result = await this.runtimeHandler.runtimeCallFunctionOn(
      isHidden,
      null,
      {
        nodeId: this.nodeId,
        returnByValue: true,
      },
    );
    return !result.result.value;
  }
}

Element.create = (nodeIds, runtimeHandler) => {
  return nodeIds.map(
    nodeId => new Element(nodeId, '', runtimeHandler),
  );
};

module.exports = {
  Element,
};
