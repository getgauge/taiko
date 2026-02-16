const expect = require("chai").expect;
const rewire = require("rewire");
const TEXT_NODE = 3;

class DomRects {}
const nodes = {
  23: {
    innerText: "element text",
  },
  41: {
    offsetHeight: 0,
    offsetWidth: 1,
  },
  45: {
    offsetHeight: 1,
    offsetWidth: 0,
  },
  47: {
    offsetHeight: 0,
    offsetWidth: 0,
    getClientRects: () => [new DomRects(), new DomRects()],
  },
  50: {
    offsetHeight: 0,
    offsetWidth: 0,
    getClientRects: () => [],
  },
  89: {
    nodeType: TEXT_NODE,
    parentElement: {
      offsetHeight: 0,
      offsetWidth: 1,
      getClientRects: () => [new DomRects(), new DomRects()],
    },
  },
  100: {
    draggable: true,
  },
};
describe("Element", () => {
  let Element;
  beforeEach(() => {
    Element = rewire("taiko/lib/elements/element");
    Element.__set__("Node", { TEXT_NODE });
  });
  afterEach(() => {
    Element = rewire("taiko/lib/elements/element");
  });

  const runtimeHandler = {
    runtimeCallFunctionOn: (predicate, contextId, options) => {
      return {
        result: { value: predicate.call(nodes[options.objectId]) },
      };
    },
  };

  it("should create elements from node IDs", () => {
    const expectedElements = [
      new Element(12, "", runtimeHandler),
      new Element(23, "", runtimeHandler),
      new Element(24, "", runtimeHandler),
    ];
    const actualElements = Element.create([12, 23, 24], runtimeHandler);

    expect(actualElements).to.be.deep.equal(expectedElements);
  });

  it("get should return objectId", () => {
    const objectId = 12;
    const element = new Element(
      objectId,
      "element description",
      runtimeHandler,
    );
    expect(element.get()).to.be.equal(objectId);
  });

  describe("text", () => {
    it("should return innerText of element", async () => {
      const objectId = 23;
      const element = new Element(
        objectId,
        "element description",
        runtimeHandler,
      );
      expect(await element.text()).to.be.equal("element text");
    });
  });

  describe("isDraggable", () => {
    it("should return true when draggable attribute is set", async () => {
      const objectId = 100;
      const element = new Element(
        objectId,
        "element description",
        runtimeHandler,
      );
      expect(await element.isDraggable()).to.be.true;
    });
    it("should return false when draggable attribute is not set", async () => {
      const objectId = 45;
      const element = new Element(
        objectId,
        "element description",
        runtimeHandler,
      );
      expect(await element.isDraggable()).to.be.false;
    });
  });

  describe("isVisible", () => {
    it("should be visible when offsetHeight is not zero", async () => {
      const objectId = 45;
      const element = new Element(
        objectId,
        "element description",
        runtimeHandler,
      );
      expect(await element.isVisible()).to.be.true;
    });

    it("should be visible when offsetWidth is not zero", async () => {
      const objectId = 41;
      const element = new Element(
        objectId,
        "element description",
        runtimeHandler,
      );
      expect(await element.isVisible()).to.be.true;
    });

    it("should be visible when ClientRects are more than one", async () => {
      const objectId = 47;
      const element = new Element(
        objectId,
        "element description",
        runtimeHandler,
      );
      expect(await element.isVisible()).to.be.true;
    });

    it("should not be visible", async () => {
      const objectId = 50;
      const element = new Element(
        objectId,
        "element description",
        runtimeHandler,
      );
      expect(await element.isVisible()).to.be.false;
    });

    it("should use parent node of TEXT_NODE", async () => {
      const objectId = 89;
      const element = new Element(
        objectId,
        "element description",
        runtimeHandler,
      );
      expect(await element.isVisible()).to.be.true;
    });
  });
});
