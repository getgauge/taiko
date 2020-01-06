const expect = require('chai').expect;
const rewire = require('rewire');
const Element = rewire('../../../lib/elements/element');
const TEXT_NODE = 3;
Element.__set__('Node', { TEXT_NODE });
class DomRects {}
const nodes = {
  23: {
    innerText: 'element text',
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
};
describe('Element', () => {
  let runtimeHandler = {
    runtimeCallFunctionOn: (predicate, contextId, options) => {
      return {
        result: { value: predicate.call(nodes[options.nodeId]) },
      };
    },
  };

  it('should create elements from node IDs', () => {
    const expectedElements = [
      new Element(12, '', runtimeHandler),
      new Element(23, '', runtimeHandler),
      new Element(24, '', runtimeHandler),
    ];
    const actualElements = Element.create(
      [12, 23, 24],
      runtimeHandler,
    );

    expect(actualElements).to.be.deep.equal(expectedElements);
  });

  it('get should return nodeId', () => {
    let nodeId = 12;
    let element = new Element(
      nodeId,
      'element description',
      runtimeHandler,
    );
    expect(element.get()).to.be.equal(nodeId);
  });

  describe('text', () => {
    it('should return innerText of element', async () => {
      let nodeId = 23;
      let element = new Element(
        nodeId,
        'element description',
        runtimeHandler,
      );
      expect(await element.text()).to.be.equal('element text');
    });
  });

  describe('isVisible', () => {
    it('should be visible when offsetHeight is not zero', async () => {
      let nodeId = 45;
      let element = new Element(
        nodeId,
        'element description',
        runtimeHandler,
      );
      expect(await element.isVisible()).to.be.true;
    });

    it('should be visible when offsetWidth is not zero', async () => {
      let nodeId = 41;
      let element = new Element(
        nodeId,
        'element description',
        runtimeHandler,
      );
      expect(await element.isVisible()).to.be.true;
    });

    it('should be visible when ClientRects are more than one', async () => {
      let nodeId = 47;
      let element = new Element(
        nodeId,
        'element description',
        runtimeHandler,
      );
      expect(await element.isVisible()).to.be.true;
    });

    it('should not be visible', async () => {
      let nodeId = 50;
      let element = new Element(
        nodeId,
        'element description',
        runtimeHandler,
      );
      expect(await element.isVisible()).to.be.false;
    });

    it('should use parent node of TEXT_NODE', async () => {
      let nodeId = 89;
      let element = new Element(
        nodeId,
        'element description',
        runtimeHandler,
      );
      expect(await element.isVisible()).to.be.true;
    });
  });
});
