class Element {
  constructor(nodeId, description, runtimeHandler) {
    this.nodeId = nodeId;
    this.runtimeHandler = runtimeHandler;
    this.description = description;
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
    let runtimeHandler = this.runtimeHandler;
    const isElementVisible = async nodeId => {
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
      const result = await runtimeHandler.runtimeCallFunctionOn(
        isHidden,
        null,
        {
          nodeId: nodeId,
          returnByValue: true,
        },
      );
      return !result.result.value;
    };
    return await isElementVisible(this.nodeId);
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
