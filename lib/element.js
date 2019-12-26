class Element {
  constructor(nodeId, runtimeHandler) {
    this.nodeId = nodeId;
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
}
Element.create = (nodeIds, runtimeHandler) => {
  return nodeIds.map(nodeId => new Element(nodeId, runtimeHandler));
};
module.exports = {
  Element,
};
