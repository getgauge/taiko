const expect = require('chai').expect;
const rewire = require('rewire');
const Element = rewire('../../lib/elements/element');
const elementSearch = rewire('../../lib/elementSearch');
class DomRects {}
const TEXT_NODE = 3;
describe('Element Search', () => {
  describe('Filter visible nodes', () => {
    let nodeIds, runtimeHandler;
    const filterVisibleNodes = elementSearch.__get__('filterVisibleNodes');
    beforeEach(() => {
      Element.__set__('Node', { TEXT_NODE });
      nodeIds = {
        23: {
          offsetHeight: 1,
          offsetWidth: 0,
        },
        45: {
          offsetHeight: 0,
          offsetWidth: 1,
        },
        67: {
          offsetHeight: 0,
          offsetWidth: 1,
          getClientRects: () => [new DomRects(), new DomRects()],
        },
        68: {
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
      runtimeHandler = {
        runtimeCallFunctionOn: (predicate, args, obj) => {
          const result = {
            result: { value: predicate.call(nodeIds[obj.nodeId]) },
          };
          return result;
        },
      };
    });
    const createElement = elements =>
      elements.map(nodeId => new Element(nodeId, '', runtimeHandler));

    it('should return visible nodes', async () => {
      const visibleNodeIds = createElement([23, 45, 67]);
      const elementsToFilter = createElement([23, 45, 67, 68]);
      expect(await filterVisibleNodes(elementsToFilter)).to.eql(visibleNodeIds);
    });

    it('should use parentElement to determine visibility for text nodes', async () => {
      const visibleNodeIds = createElement([23, 89]);
      const elementsToFilter = createElement([23, 68, 89]);
      expect(await filterVisibleNodes(elementsToFilter)).to.eql(visibleNodeIds);
    });
  });
});
